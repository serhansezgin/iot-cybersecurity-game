const forge = require('node-forge')
const fs = require('fs')
const path = require('path')
const Router = require('koa-router')
const { prepareDatabase } = require('../database')
const { requireAuthentication, loginPost } = require('../authentication')
const app = require('../websocketServer')

prepareDatabase('789c75724608ed258736322b0d780ca0b6ce23458610ec6687cfd471a34c8a5220d34a83248099c9815bcab86cb97b97c54331c10b23ef07251938ebf9cbac35').then((database) => {
  const router = new Router()

  router.get('/', requireAuthentication, (ctx) => {
    ctx.type = 'html'
    ctx.body = fs.createReadStream(path.join('level-1', 'client', 'index.html'))
  })

  router.get('/login', (ctx) => {
    ctx.type = 'html'
    ctx.body = fs.createReadStream(path.join('level-1', 'client', 'login.html'))
  })

  const authenticate = (ctx, user) => {
    return new Promise((resolve, reject) => {
      const messageDigest = forge.md.sha512.create()
      messageDigest.update(user.password)
      const finalString = `SELECT * FROM users WHERE username='${user.username}' AND hash='${messageDigest.digest().toHex()}';`
      console.log('fs', finalString)
      database.all(finalString, (err, rows) => {
        if (err) reject(err)

        console.log(rows)
        if (rows && rows.length > 0) ctx.session.authenticated = true
        resolve()
      })
    })
  }

  router.post('/login', async (ctx, next) => loginPost(ctx, next, authenticate))

  app
    .use(router.routes())
    .use(router.allowedMethods())

  app.listen(3000)
})
