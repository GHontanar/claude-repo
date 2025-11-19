/**
 * Script de Importación de Nomenclatura ORPHA
 *
 * Descarga la nomenclatura completa de Orphanet (~9000 códigos) y
 * la importa a la base de datos MySQL.
 *
 * Fuentes de datos (orden de prioridad):
 * 1. API Orphacode: http://api.orphacode.org
 * 2. GitHub Backup: https://raw.githubusercontent.com/orphanet-rare-diseases-issues/RD-CODE/master/...
 * 3. Archivo local (si existe)
 *
 * Uso:
 *   node backend/scripts/import_orpha_nomenclature.js
 *
 * Requisitos:
 *   - npm install axios xml2js
 *   - Conexión a base de datos configurada
 */

const axios = require('axios');
const xml2js = require('xml2js');
const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const CONFIG = {
  // URLs de fuentes de datos
  sources: {
    // GitHub como fuente principal (más confiable)
    github: 'https://raw.githubusercontent.com/orphanet-rare-diseases-issues/RD-CODE/master/ORPHAnomenclature/ORPHAnomenclature_es.xml',
    // API de Orphacode (puede estar deshabilitada)
    api: 'http://api.orphacode.org/nomenclature/es',
    // Archivo local como fallback
    local: path.join(__dirname, '../data/orphacode_backup.xml')
  },

  // Configuración de importación
  batchSize: 500,           // Registros por lote
  timeout: 60000,           // Timeout para descarga (60 segundos)
  retries: 3,               // Reintentos en caso de error

  // Configuración de base de datos
  tableName: 'orpha_nomenclatura'
};

// =====================================================
// FUNCIONES DE DESCARGA
// =====================================================

/**
 * Descargar datos desde GitHub
 */
async function downloadFromGitHub() {
  console.log('📥 Descargando desde GitHub...');
  console.log(`   URL: ${CONFIG.sources.github}`);

  try {
    const response = await axios.get(CONFIG.sources.github, {
      timeout: CONFIG.timeout,
      responseType: 'text'
    });

    console.log('✅ Descarga desde GitHub exitosa');
    return response.data;
  } catch (error) {
    console.error(`❌ Error descargando desde GitHub: ${error.message}`);
    throw error;
  }
}

/**
 * Descargar datos desde API Orphacode
 */
async function downloadFromAPI() {
  console.log('📥 Descargando desde API Orphacode...');
  console.log(`   URL: ${CONFIG.sources.api}`);

  try {
    const response = await axios.get(CONFIG.sources.api, {
      timeout: CONFIG.timeout,
      headers: {
        'Accept': 'application/xml, text/xml, application/json'
      }
    });

    console.log('✅ Descarga desde API exitosa');
    return response.data;
  } catch (error) {
    console.error(`❌ Error descargando desde API: ${error.message}`);
    throw error;
  }
}

/**
 * Cargar datos desde archivo local
 */
async function loadFromLocal() {
  console.log('📂 Cargando desde archivo local...');
  console.log(`   Archivo: ${CONFIG.sources.local}`);

  try {
    const data = await fs.readFile(CONFIG.sources.local, 'utf8');
    console.log('✅ Archivo local cargado');
    return data;
  } catch (error) {
    console.error(`❌ Error cargando archivo local: ${error.message}`);
    throw error;
  }
}

/**
 * Intentar descargar desde múltiples fuentes
 */
async function fetchOrphaData() {
  const sources = [
    { name: 'GitHub', fn: downloadFromGitHub },
    { name: 'API Orphacode', fn: downloadFromAPI },
    { name: 'Archivo Local', fn: loadFromLocal }
  ];

  for (const source of sources) {
    try {
      console.log(`\n🔍 Intentando fuente: ${source.name}`);
      const data = await source.fn();

      // Guardar backup local si vino de fuente remota
      if (source.name !== 'Archivo Local') {
        await saveLocalBackup(data);
      }

      return data;
    } catch (error) {
      console.warn(`⚠️  Fuente ${source.name} no disponible, intentando siguiente...`);
    }
  }

  throw new Error('❌ No se pudo obtener datos de ninguna fuente');
}

/**
 * Guardar backup local de los datos
 */
async function saveLocalBackup(data) {
  try {
    const backupDir = path.dirname(CONFIG.sources.local);
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(CONFIG.sources.local, data, 'utf8');
    console.log(`💾 Backup guardado: ${CONFIG.sources.local}`);
  } catch (error) {
    console.warn(`⚠️  No se pudo guardar backup local: ${error.message}`);
  }
}

// =====================================================
// FUNCIONES DE PARSEO
// =====================================================

/**
 * Parsear XML de Orphanet a JSON
 */
async function parseOrphaXML(xmlData) {
  console.log('\n🔄 Parseando datos XML...');

  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    trim: true,
    normalize: true,
    normalizeTags: true,
    attrValueProcessors: [(value) => value.trim()]
  });

  try {
    const result = await parser.parseStringPromise(xmlData);

    // La estructura puede variar, intentar varias rutas comunes
    let disorders = null;

    // Estructura típica: JDBOR > DisorderList > Disorder
    if (result.jdbor && result.jdbor.disorderlist && result.jdbor.disorderlist.disorder) {
      disorders = Array.isArray(result.jdbor.disorderlist.disorder)
        ? result.jdbor.disorderlist.disorder
        : [result.jdbor.disorderlist.disorder];
    }
    // Estructura alternativa
    else if (result.orphadata && result.orphadata.disorderlist) {
      disorders = Array.isArray(result.orphadata.disorderlist.disorder)
        ? result.orphadata.disorderlist.disorder
        : [result.orphadata.disorderlist.disorder];
    }
    // Otra estructura posible
    else if (Array.isArray(result.disorder)) {
      disorders = result.disorder;
    }

    if (!disorders) {
      throw new Error('No se pudo encontrar la lista de disorders en el XML');
    }

    console.log(`✅ XML parseado: ${disorders.length} enfermedades encontradas`);

    // Transformar a formato estándar
    const nomenclature = disorders.map(disorder => {
      // Extraer valores, asegurándose de obtener strings
      const extractValue = (val) => {
        if (!val) return null;
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val._) return val._;
        if (typeof val === 'object' && val.toString) return val.toString();
        return String(val);
      };

      const nombre = extractValue(disorder.name || disorder.preferredterm) || 'Sin nombre';

      return {
        code: `ORPHA.${disorder.orphacode || disorder.orphanumber}`,
        nombre: nombre,
        nombre_cientifico: extractValue(disorder.synonym),
        grupo_clinico: extractValue(disorder.disordergroup || disorder.expertlink),
        es_activo: disorder.disorderstatus !== 'Obsolete' && disorder.disorderstatus !== 'Inactive',
        fuente: 'Orphanet',
        version_orphanet: new Date().toISOString().slice(0, 7) // YYYY-MM
      };
    });

    return nomenclature;
  } catch (error) {
    console.error('❌ Error parseando XML:', error.message);
    throw error;
  }
}

/**
 * Parsear JSON (si la API retorna JSON en lugar de XML)
 */
function parseOrphaJSON(jsonData) {
  console.log('\n🔄 Parseando datos JSON...');

  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    // Adaptar estructura según el formato JSON de Orphanet
    const disorders = data.disorders || data.DisorderList || data;

    const nomenclature = disorders.map(disorder => ({
      code: `ORPHA.${disorder.orphacode || disorder.OrphaCode || disorder.code}`,
      nombre: disorder.name || disorder.Name || disorder.preferredTerm || 'Sin nombre',
      nombre_cientifico: disorder.synonym || null,
      grupo_clinico: disorder.group || null,
      es_activo: true,
      fuente: 'Orphanet',
      version_orphanet: new Date().toISOString().slice(0, 7)
    }));

    console.log(`✅ JSON parseado: ${nomenclature.length} enfermedades encontradas`);
    return nomenclature;
  } catch (error) {
    console.error('❌ Error parseando JSON:', error.message);
    throw error;
  }
}

/**
 * Detectar formato y parsear
 */
async function parseOrphaData(data) {
  // Detectar si es XML o JSON
  if (typeof data === 'string' && data.trim().startsWith('<')) {
    return await parseOrphaXML(data);
  } else {
    return parseOrphaJSON(data);
  }
}

// =====================================================
// FUNCIONES DE IMPORTACIÓN A BD
// =====================================================

/**
 * Limpiar tabla antes de importar (opcional)
 */
async function truncateTable() {
  console.log('\n🗑️  Limpiando tabla existente...');

  try {
    await pool.execute(`TRUNCATE TABLE ${CONFIG.tableName}`);
    console.log('✅ Tabla limpiada');
  } catch (error) {
    console.error('❌ Error limpiando tabla:', error.message);
    throw error;
  }
}

/**
 * Importar nomenclaturas en lotes
 */
async function importNomenclature(nomenclature) {
  console.log('\n📊 Importando a base de datos...');
  console.log(`   Total de registros: ${nomenclature.length}`);
  console.log(`   Tamaño de lote: ${CONFIG.batchSize}`);

  const startTime = Date.now();
  let imported = 0;
  let errors = 0;

  try {
    // Importar en lotes
    for (let i = 0; i < nomenclature.length; i += CONFIG.batchSize) {
      const batch = nomenclature.slice(i, i + CONFIG.batchSize);

      // Preparar valores para INSERT
      const values = batch.map(item => [
        item.code,
        item.nombre,
        item.nombre_cientifico,
        item.grupo_clinico,
        item.es_activo,
        item.fuente,
        item.version_orphanet
      ]);

      try {
        await pool.query(
          `INSERT INTO ${CONFIG.tableName}
           (code, nombre, nombre_cientifico, grupo_clinico, es_activo, fuente, version_orphanet)
           VALUES ?
           ON DUPLICATE KEY UPDATE
             nombre = VALUES(nombre),
             nombre_cientifico = VALUES(nombre_cientifico),
             grupo_clinico = VALUES(grupo_clinico),
             es_activo = VALUES(es_activo),
             version_orphanet = VALUES(version_orphanet),
             fecha_actualizacion = CURRENT_TIMESTAMP`,
          [values]
        );

        imported += batch.length;

        // Mostrar progreso
        const progress = ((imported / nomenclature.length) * 100).toFixed(1);
        process.stdout.write(`\r   Progreso: ${imported}/${nomenclature.length} (${progress}%)`);
      } catch (error) {
        console.error(`\n❌ Error en lote ${i}-${i + batch.length}:`, error.message);
        errors += batch.length;
      }
    }

    console.log('\n'); // Nueva línea después del progreso

    // Insertar código especial del sistema
    await pool.execute(
      `INSERT INTO ${CONFIG.tableName} (code, nombre, fuente) VALUES
       ('PENDIENTE', 'Pendiente de Diagnóstico', 'Sistema')
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)`
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Importación completada');
    console.log(`   Registros importados: ${imported}`);
    console.log(`   Errores: ${errors}`);
    console.log(`   Duración: ${duration}s`);

    return { imported, errors, duration };
  } catch (error) {
    console.error('❌ Error en importación:', error.message);
    throw error;
  }
}

/**
 * Obtener estadísticas de la tabla
 */
async function getStatistics() {
  console.log('\n📈 Estadísticas finales:');

  try {
    const [stats] = await pool.execute(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN fuente = 'Orphanet' THEN 1 END) as orphanet_count,
        COUNT(CASE WHEN fuente = 'Sistema' THEN 1 END) as sistema_count,
        COUNT(CASE WHEN es_activo = TRUE THEN 1 END) as activos,
        COUNT(CASE WHEN es_activo = FALSE THEN 1 END) as inactivos,
        MAX(version_orphanet) as version_actual,
        MAX(fecha_actualizacion) as ultima_actualizacion
      FROM ${CONFIG.tableName}
    `);

    const s = stats[0];
    console.log(`   Total nomenclaturas: ${s.total}`);
    console.log(`   - Orphanet: ${s.orphanet_count}`);
    console.log(`   - Sistema: ${s.sistema_count}`);
    console.log(`   - Activas: ${s.activos}`);
    console.log(`   - Inactivas: ${s.inactivos}`);
    console.log(`   Versión: ${s.version_actual}`);
    console.log(`   Última actualización: ${s.ultima_actualizacion}`);

    // Mostrar algunos ejemplos
    const [examples] = await pool.execute(`
      SELECT code, nombre FROM ${CONFIG.tableName}
      WHERE fuente = 'Orphanet'
      ORDER BY RAND()
      LIMIT 5
    `);

    console.log('\n📋 Ejemplos aleatorios:');
    examples.forEach(ex => {
      console.log(`   ${ex.code} - ${ex.nombre}`);
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
  }
}

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function main() {
  console.log('========================================');
  console.log('  Importación Nomenclatura ORPHA');
  console.log('========================================\n');

  const totalStartTime = Date.now();

  try {
    // 1. Descargar datos
    const rawData = await fetchOrphaData();

    // 2. Parsear datos
    const nomenclature = await parseOrphaData(rawData);

    if (nomenclature.length === 0) {
      throw new Error('No se encontraron nomenclaturas para importar');
    }

    // 3. Limpiar tabla (opcional - comentar si quieres UPDATE en lugar de TRUNCATE)
    await truncateTable();

    // 4. Importar a BD
    const result = await importNomenclature(nomenclature);

    // 5. Mostrar estadísticas
    await getStatistics();

    const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);

    console.log('\n========================================');
    console.log('  ✅ Proceso completado exitosamente');
    console.log(`  Duración total: ${totalDuration}s`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n========================================');
    console.error('  ❌ ERROR EN IMPORTACIÓN');
    console.error('========================================');
    console.error(error);
    console.error('\n');
    process.exit(1);
  } finally {
    // Cerrar pool de conexiones
    await pool.end();
  }
}

// =====================================================
// EXPORTAR FUNCIONES (para uso en otros scripts)
// =====================================================

module.exports = {
  importNomenclature: main,
  fetchOrphaData,
  parseOrphaData
};

// =====================================================
// EJECUTAR SI SE LLAMA DIRECTAMENTE
// =====================================================

if (require.main === module) {
  main();
}
