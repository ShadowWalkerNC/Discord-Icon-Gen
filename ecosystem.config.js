/**
 * PM2 Ecosystem Config — Sigil
 *
 * Usage:
 *   pm2 start ecosystem.config.js          # start all
 *   pm2 start ecosystem.config.js --env production
 *   pm2 stop sigil
 *   pm2 restart sigil
 *   pm2 logs sigil
 *   pm2 save && pm2 startup               # persist across reboots
 */

module.exports = {
    apps: [
        {
            name:             'sigil',
            script:           'src/index.js',
            instances:        1,
            autorestart:      true,
            watch:            false,
            max_memory_restart: '512M',
            restart_delay:    3000,
            max_restarts:     10,

            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },

            // Log config
            out_file:         'logs/sigil-out.log',
            error_file:       'logs/sigil-error.log',
            merge_logs:       true,
            log_date_format:  'YYYY-MM-DD HH:mm:ss Z',

            // Graceful shutdown
            kill_timeout:     5000,
            wait_ready:       true,
            listen_timeout:   10000,
        },

        // Optional: run the GUI server as a separate process
        // Uncomment if you want the web GUI managed by PM2 too
        // {
        //     name:         'sigil-gui',
        //     script:       'gui/gui-server.js',
        //     instances:    1,
        //     autorestart:  true,
        //     watch:        false,
        //     env_production: { NODE_ENV: 'production' },
        //     out_file:     'logs/gui-out.log',
        //     error_file:   'logs/gui-error.log',
        //     merge_logs:   true,
        //     log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        // },
    ],
};
