const Joi = require('joi');

exports.validateUser = (user) => {
  const schema = Joi.object({
    username: Joi.string().min(5).max(20).required(),
    first_name: Joi.string().min(2).max(30).required(),
    last_name: Joi.string().min(2).max(30).required(),
    ic_no: Joi.string().min(4).max(30).required(),
    address: Joi.string().min(2).max(30).required(),
    country: Joi.string().min(2).max(20).required(),
    mobileno: Joi.string().min(4).max(20).required(),
    //referrer_username: Joi.required(),
    email: Joi.string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
      })
      .required(),

    password: Joi.string()
      .pattern(new RegExp('^[a-zA-Z0-9]{8,30}$'))
      .required(),
  });

  return schema.validate(user, { presence: 'required', abortEarly: false });
};

exports.validateSignIn = (user) => {
  const schema = Joi.object({
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] },
    }),

    password: Joi.string().required(), //.pattern(new RegExp('^[a-zA-Z0-9]{8,30}$')),
  });

  return schema.validate(user, { presence: 'required' });
};
