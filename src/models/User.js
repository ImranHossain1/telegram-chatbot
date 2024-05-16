import mongoose from "mongoose";
const userSchema = mongoose.Schema({
    tgId:{
        type: String,
        require: true,
        unique:true
    },
    firstName:{
        type: String,
        require: true
    },
    lastName:{
        type: String,
        require: true
    },
    isBot:{
        type: Boolean,
        require: true
    },
    username: {
        type: String,
        require: true,
        unique: true
    },
    promptToken:{
        type: Number,
        require: false
    }, 
    completionTokens: {
        type: Number,
        require: false
    },
}, {
    timestamps: true
})


export default mongoose.model('User', userSchema)