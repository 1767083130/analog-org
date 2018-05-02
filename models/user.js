/**
 * A model for our user
 */
'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('../lib/crypto');
const paginate = require('mongoose-paginate');

var userModel = function () {

    const UserSchema = mongoose.Schema({
        name: { type: String, default: '' },
        email: { type: String, default: '' },
        userName: { type: String, default: '' },
        provider: { type: String, default: '' },
        password: { type: String, default: '' },
        authToken: { type: String, default: '' },
        role : String,
        srcUserId : String,
        mobile : {type : String}
    });

    /**
     * Helper function that hooks into the 'save' method, and replaces plaintext passwords with a hashed version.
     */
    UserSchema.pre('save', function (next) {
        var user = this;

        //If the password has not been modified in this save operation, leave it alone (So we don't double hash it)
        if (!user.isModified('password')) {
            next();
            return;
        }
        //Encrypt it using bCrypt. Using the Sync method instead of Async to keep the code simple.
        var hashedPwd = bcrypt.hashSync(user.password, crypto.getCryptLevel());

        //Replace the plaintext pw with the Hash+Salted pw;
        user.password = hashedPwd;

        //Continue with the save operation
        next();
    });


    UserSchema.path('userName').validate(function (userName, fn) {
        const User = mongoose.model('User');
        if (this.skipValidation()) {
            fn(true);
        }

        // Check only when it is a new user or when email field is modified
        if (this.isNew || this.isModified('userName')) {
            User.find({ userName: userName }).exec(function (err, users) {
                fn(!err && users.length === 0);
            });
        }
        else{
            fn(true);
        }
    }, 'userName already exists');

    UserSchema.path('userName').validate(function (userName) {
        if (this.skipValidation()) return true;
        return userName.length;
    }, 'userName cannot be blank');


    /**
     * Methods
     */
    UserSchema.methods = {

        /**
         * Helper function that takes a plaintext password and compares it against the user's hashed password.
         * @param plainText
         * @returns true/false
         */
        passwordMatches: function (plainText) {
            // var user = this;
            return bcrypt.compareSync(plainText, this.password);
            //return plainText == this.password;
        },
 
        /**
        * Validation is not required if using OAuth
        */
        skipValidation: function () {
            return false; //todo
            //return ~oAuthTypes.indexOf(this.provider);
        }
    };

    /**
     * Statics
     */

    UserSchema.statics = {

        /**
        * Load
        *
        * @param {Object} options
        * @param {Function} cb
        * @api private
        */
        load: function (options, cb) {
            options.select = options.select || 'name username';
            return this.findOne(options.criteria)
                .select(options.select)
                .exec(cb);
        }

    };
    
    UserSchema.plugin(paginate);
    return mongoose.model('User', UserSchema);
};

module.exports = new userModel();
