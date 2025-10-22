const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        let filtro = {user: req.userId}

        const notifications = await Notification.find(filtro)
        .populate('user','username')
        .populate('task','title')
        .exec();

        res.json(notifications)
    }
    catch (error) {
        console.error("No notificaciones :(")
        res.status(500).json({error: 'Notificacion\'t'})
    }
});

router.post('/notifications',  authMiddleware, async (req,res) =>{
    try {
        const {message, user, task} = req.body

        if (!user || !task)
        {
            return res.status(400).json({error: 'Notificación incompleta'})
        }

        const newNotification = new Notification({
            message,
            user,
            task,
        })

        await newNotification.save()

        const notificationResponse = await newNotification
            .populate('user','username')
            .populate('task','title')

        res.status(201).json(notificationResponse)
    }
    catch (error) {
        console.error('Notificacion\'t :(')
        res.status(500).json({error: 'Nooo la notificación'})
    }
})

router.delete('/notifications/:id', authMiddleware, async (req,res) =>{
    try {
        const {id} = req.params

        const result = await Notification.deleteOne({"_id":id})

        if (!result)
        {
            return res.status(404).json({error:'Notificacion no estar'})
        }

        res.status(204).send()
    }
    catch {
        console.error('No-tificacion')
        res.status(500).json({error:'Error al eliminar la notificacacion'})
    }
})

module.exports = router