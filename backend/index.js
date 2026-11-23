import dotenv from 'dotenv'
import express from 'express'
// const express = require('express')
const app = express()
// const port = 3000
dotenv.config()
const port = process.env.PORT

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/test2', (req, res) => {
    res.send('Hello World 22!')
  })
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
