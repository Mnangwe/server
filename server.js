// Creating a server
const express = require('express');
const path = require('path');
const app = express();
const bodyparser = require('body-parser')
const cors = require('cors')
const multer = require('multer')
const fileExtension = require('file-extension')

app.use(cors())

app.set('port', process.env.port || 3400) 
app.use(bodyparser.json());

// Start a server
app.get('/', (req, res) => {
    res.json({
        "statusCode":200,
        "statusMessage":"Successfully!!"
    });
    const teamName = "Developed by Tech Express"
    res.send(`<h1>Firebase and Express <br/> ${teamName}<h1>`);
})

// Firebase configurations
const admin = require('firebase-admin');
const secretKeys = require('./NewPermissions.json');
const projectId = "express-demo-a7c37.appspot.com"
const { allowedNodeEnvironmentFlags } = require('process');

admin.initializeApp({
    credential: admin.credential.cert(secretKeys),
    storageBucket: projectId
})


// // Firestore and Authentication
const firestore = admin.firestore();
const auth = admin.auth();
// Cloud storage
const store = admin.storage();
const bucket = store.bucket()
// const bucket = admin.storage().bucket()

// Using Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`)
    },
})
// const upload = multer({ storage: multer.memoryStorage(), limits: {
const upload = multer({ storage: storage, limits: {
    // Size limit
    fileSize: 2000000
},
    fileFilter(req, file, cb) {
        if(file.originalname.match(/\.(jpg | jpeg | png)$/)) {
            // Error
            cb(new Error('Please upload a JPG or PNG images only!'))
        }
        // Success
        cb(undefined, true)
    }
 })

app.post('/uploadfile', upload.single('uploadedImage'), (req, res, next) => {
    const file = req.file;
    console.log(req)
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    // else {
        
    //     const blob = bucket.file(req.file.filename)

    //     const blobWriter = blob.createWriteStream({
    //         metadata: {
    //             contentType: req.file.mimetype
    //         }
    //     })
    //     blobWriter.on('error', (err) => {
    //         console.log(err)
    //     })
    //     blobWriter.on('finish', () => {
    //         res.status(200).send("File uploaded.")
    //     })
    //     blobWriter.end(req.file.buffer)
    // }
    res.status(200).send({
        statusCode: 200,
        status: 'succes',
        uploadedFile: file
        // res.json(req.file);
    })

}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message
    })
})

// Post  method with Custom Claims
app.post('/users', (req, res, next) => {
    const user = req.body
    auth.createUser(user).then(userdata => {
        firestore.collection('users').doc(userdata.uid).
        set({name:user.name,surname:user.surname,profession:user.profession,gender:user.gender
            ,email:user.email,intro:user.intro, mentor:user.mentor}).then(()=>{
            if (user.mentor){
                auth.createCustomToken(userdata.uid,{mentor:true}).then((claim) => {
                    console.log(claim)
                    res.status(201).send({message: 'Welcome, your experience is ours!'});
                }).catch(error=>{
                    return res.status(500).send(error.message);})
            }
            else if(user.mentor===undefined || !user.mentor){
                auth.createCustomToken(userdata.uid,{mentor: false}).then(() => {
                    res.send('the user is not an admin')})
            }
        }).catch(error=> {
                return res.status(500).send(error.message);})
    }).catch(error => {
        return res.status(500).send(error.message);})
})

//get all users
app.get('/users', (req, res, next) => {
    const response = [];
    firestore.collection('users').get().then(users => {
        users.forEach(user => {
            response.push({ id: user.id, ...user.data() })
        })
        return res.send(response)
    }).catch(error => {
        return res.status(500).send(error.message);
    })
})

// Get one user
app.get('/users/:id', (req, res, next) => {
    const id = req.params.id;
    firestore.collection('users').doc(id).get().then(user => {
        res.status(200).send({
            id: user.id, ...user.data()
        })
    }).catch(error => {
        return res.status(500).send(error.message);
    })
})

// Update a user



// Delete Method
app.delete('/users/:id', function(req, res, next){
    const id = req.params.id;
    if(id===undefined){
        res.status(500).send('User is not defined')
    }
    else{
        auth.deleteUser(id).then(()=>{
            firestore.collection('users').doc(id).delete().then(user=>{
                res.status(200).send('user has been deleted')
            })
        })
    }
})



app.listen(app.get('port'), server =>{
    console.info(`Server listen on port ${app.get('port')}`);
})



