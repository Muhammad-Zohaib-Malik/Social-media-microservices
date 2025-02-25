import Joi from 'joi'


export const validateRegistration=(data)=>{
const schema=Joi.object({
  username:Joi.string().min(3).max(30).required(),
  email:Jio.string().email().required(),
  password:Jio.string().min(6).required(),
})
return schema.validate(data)
}
