import { User } from "../models/identity.model.js"
import { generateToken } from "../utils/generateToken.js"
import logger from "../utils/logger.js"
import { validateRegistration } from "../utils/validation.js"

export const registerUser=async(req,res)=>{
  logger.info("Registration hit point end")
  try {

    const {error}=validateRegistration(req.body)
    if(error)
    {
      logger.warn('Validation error ',error.details[0].message)
      return res.status(404).json({success:false,message:error.details[0].message})
    }
    
    const{username,email,password}=req.body
    let user=await User.findOne({$or:[{email},{username}]})
    if(user)
    {
      logger.warn('User already exists ')
      return res.status(404).json({success:false,message:"User already exists"})
    }

    user=new User({
      username,
      email,
      password
    })

    await user.save()
    logger.warn('user created successfully',user._id)
    const {accessToken,refreshToken}=await generateToken(user)
    return res.status(201).json({success:true,message:"User registered successfully",accessToken,refreshToken})
    
  } catch (error) {
    logger.error("Registeration error occur",error)
    res.status(500).json({success:false,message:"Internal error"})
  }
}