import cron from 'node-cron'
import { envsConfig } from './src/config/index.config.js'
import { sq } from './src/lib/db.lib.js'
import { cargarDatos } from './src/scripts/seed.script.js'
import server from './src/server.js'
import {
  sorteoServices,
  ticketServices,
} from './src/services/index.services.js'
// CAMBIO 1: Importamos el nuevo servicio encargado de la copia de seguridad inteligente
import { backupUtils } from './src/utils/index.utils.js'

server.listen(envsConfig.PORT, () => {
  console.log(
    `Servidor recibiendo peticiones por el puerto: ${envsConfig.PORT}`,
  )

  sq.sync({
    logging: false,
    force: false, // Cambiado a false para no borrar tus tickets ganadores
    alter: false,
  })
    .then(() => {
      console.log('Base de datos sincronizada con éxito')

      cargarDatos()

      // 1. CRON MINUTAL: Cierre de sorteos
      cron.schedule('* * * * *', async () => {
        try {
          const cerrados = await sorteoServices.verificarCierreSorteos()
          if (cerrados > 0) {
            console.log(
              `[SISTEMA]: Se han cerrado ${cerrados} sorteos automáticamente.`,
            )
          }
        } catch (error) {
          console.error('[CRON ERROR - CIERRE]:', error.message)
        }
      })

      // 2. CRON DIARIO (00:00): Expiración de tickets (4 días hábiles)
      cron.schedule(
        '0 0 * * *',
        async () => {
          console.log('[SISTEMA]: Iniciando validación de tickets expirados...')
          try {
            const resultado =
              await ticketServices.expirarTicketsPorVencimiento()

            if (resultado.count > 0) {
              console.log(
                `[SISTEMA]: Se han marcado ${resultado.count} tickets como "Expirado".`,
              )
            }
          } catch (error) {
            console.error('[CRON ERROR - EXPIRACIÓN]:', error.message)
          }
        },
        {
          timezone: 'America/Guayaquil',
        },
      )

      // MODIFICADO PARA PRUEBA: Se ejecutará exactamente a las 18:40 de Ecuador
      cron.schedule(
        '* 10,17 * * *',
        async () => {
          try {
            await backupUtils.ejecutarCopiaSeguridad()
          } catch (error) {
            console.error('[CRON ERROR - BACKUP AUTOMÁTICO]:', error.message)
          }
        },
        {
          timezone: 'America/Guayaquil',
        },
      )
    })
    .catch((err) => {
      
      console.log(`Error al sincronizar la base de datos: ${err.message}`)
    })
})
