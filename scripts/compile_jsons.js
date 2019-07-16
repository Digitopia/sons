const fs = require('fs')
const path = require('path')
const glob = require('glob')

const dev = process.env.NODE_ENV === 'development'
const AUDIOS_SRC_DIR = dev ? 'audios' : 'dist/audios'
const AUDIOS_DST_DIR = dev ? 'public' : 'dist/audios'
const COMBINED_AUDIOS_FN = 'all.json'

let combined = []
glob(
    `${AUDIOS_SRC_DIR}/**/!(${path.basename(
        COMBINED_AUDIOS_FN,
        '.json'
    )}).json`,
    (err, files) => {
        if (err) {
            console.error('Error combining all jsons into one:', err)
            process.exit(1)
        }
        files.forEach(file => {
            console.log(file)
            const audioJson = JSON.parse(fs.readFileSync(file))
            combined.push(audioJson)
        })
        fs.writeFileSync(
            `${AUDIOS_DST_DIR}/${COMBINED_AUDIOS_FN}`,
            JSON.stringify(combined, null, 4)
        )
    }
)
