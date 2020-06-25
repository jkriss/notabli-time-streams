const fs = require('fs')
const path = require('path')
const mime = require('mime')
const fg = require('fast-glob')
const { FileStore } = require('time-streams')

async function run() {
  const [dir, streamName='notabli'] = process.argv.slice(2)
  if (!dir) {
    console.error('First argument must be a Notabli export directory')
    process.exit(1)
  }

  const stream = new FileStore(streamName)
  const metaStream = new FileStore(streamName+'-metadata')

  const mediaTypes = ['Notes', 'Videos', 'Quotes', 'Photos']
  for (const mediaType of mediaTypes) {

    const metaDir = path.join(dir, mediaType, 'meta-inf')
    const metadataPaths = fs.readdirSync(metaDir)
    // console.log("metdata files:", metadataPaths)

    for (const mp of metadataPaths) {
      const json = JSON.parse(fs.readFileSync(path.join(metaDir, mp), 'utf8'))
      const id = mp.split('.')[0]
      const date = new Date(json.happened_at)

      const prefix = path.join(dir, mediaType, id)
      // console.log("looking for", prefix)
      const mediaPaths = await fg([prefix+'*'])
      const mediaPath = mediaPaths[0]
      const ext = path.extname(mediaPath)
      // console.log(json)

      const name = id

      const mediaId = await stream.save({
        name,
        date,
        body: fs.readFileSync(mediaPath),
        contentType: mime.getType(ext),
        overwrite: true
      })
      json.media = `../${streamName}/${mediaId}`
      await metaStream.save({
        name,
        date,
        body: JSON.stringify(json, null, 2),
        contentType: 'application/json',
        overwrite: true
      })
    }
  }
}

run()
