/**
 * Import Controller
 * Maneja la importación de archivos CSV/XLSX
 */

const Patient = require('../models/Patient');
const { processFile } = require('../utils/csvParser');
const fs = require('fs').promises;
const path = require('path');

/**
 * Importar archivo CSV/XLSX
 * POST /api/import
 */
exports.importFile = async (req, res) => {
  let filePath = null;

  try {
    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({
        error: 'No se proporcionó ningún archivo',
        code: 'NO_FILE'
      });
    }

    filePath = req.file.path;

    // Determinar tipo de archivo
    const ext = path.extname(req.file.originalname).toLowerCase();
    let fileType;

    if (ext === '.csv') {
      fileType = 'csv';
    } else if (ext === '.xlsx' || ext === '.xls') {
      fileType = 'xlsx';
    } else {
      return res.status(400).json({
        error: 'Formato de archivo no válido. Use CSV o XLSX',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Procesar archivo
    const { validRows, errors } = await processFile(filePath, fileType);

    // Contadores para el resumen
    let pacientesNuevos = 0;
    let pacientesActualizados = 0;
    const erroresDetalle = [...errors];

    // Procesar cada fila válida
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];

      try {
        // Buscar si el paciente ya existe
        const existingPatient = await Patient.findByNHC(row.nhc);

        if (existingPatient) {
          // Paciente existe: combinar diagnósticos y actualizar fecha si es más reciente

          // Combinar diagnósticos sin duplicados
          const currentDiagnosticos = existingPatient.diagnosticos;
          const newDiagnosticos = row.diagnosticos;
          const mergedDiagnosticos = [...new Set([...currentDiagnosticos, ...newDiagnosticos])];

          // Comparar fechas
          const existingDate = new Date(existingPatient.fecha_ultimo_seguimiento);
          const newDate = new Date(row.fecha_ultimo_seguimiento);

          if (newDate > existingDate) {
            // Actualizar paciente
            await Patient.update(row.nhc, {
              diagnosticos: mergedDiagnosticos,
              fecha_ultimo_seguimiento: row.fecha_ultimo_seguimiento
            });
            pacientesActualizados++;
          } else {
            // Solo actualizar diagnósticos, mantener fecha existente
            if (mergedDiagnosticos.length > currentDiagnosticos.length) {
              await Patient.update(row.nhc, {
                diagnosticos: mergedDiagnosticos,
                fecha_ultimo_seguimiento: existingPatient.fecha_ultimo_seguimiento
              });
              pacientesActualizados++;
            }
            // Si no hay cambios, no hacer nada
          }
        } else {
          // Paciente nuevo: crear
          await Patient.create(row);
          pacientesNuevos++;
        }
      } catch (error) {
        erroresDetalle.push({
          fila: i + 1,
          nhc: row.nhc,
          error: error.message
        });
      }
    }

    // Eliminar archivo temporal
    await fs.unlink(filePath);

    // Retornar resumen
    res.json({
      message: 'Importación completada',
      summary: {
        total_filas: validRows.length + errors.length,
        pacientes_nuevos: pacientesNuevos,
        pacientes_actualizados: pacientesActualizados,
        errores: erroresDetalle.length
      },
      errores_detalle: erroresDetalle.length > 0 ? erroresDetalle : undefined
    });
  } catch (error) {
    console.error('Error en importación:', error);

    // Limpiar archivo temporal si existe
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        // Ignorar error de eliminación
      }
    }

    res.status(500).json({
      error: 'Error procesando archivo',
      details: error.message,
      code: 'IMPORT_ERROR'
    });
  }
};
