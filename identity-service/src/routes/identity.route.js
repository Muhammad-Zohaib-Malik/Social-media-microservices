import express from 'express'
import { registerUser } from '../controllers/identity.controller.js'

const identityRouter=express.Router()

identityRouter.post('/register',registerUser)

export default identityRouter