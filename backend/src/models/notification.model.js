const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    message: {type:String},
    user: {type:mongoose.Schema.Types.ObjectId, ref:'User', requiered:true},
    task: {type:mongoose.Schema.Types.ObjectId, ref:'Task', requiered:true},
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;