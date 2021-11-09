const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const store = require('json-fs-store')('./store');
const port = 3300
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/getStatus/:mac', (req, res) => {
    const mac = req.params.mac
    if(mac){
        store.load(mac, (err1, object) => {
            res.status(200).json(object)
        });
    } else {
        res.status(400).json({message: 'Bad request'})
    }
    
})

app.get('/getList', (req, res) => {
    store.load('index', (err1, object) => {
        res.status(200).json({data : object.content})
    });
    
})

app.post('/add', async (req, res) => {
    try{
        const state = parseInt(req.body.data,10) > 50 ? "ON" : "OFF";
        const id = req.body.MAC.replaceAll(':','_');
        const time = new Date();
        console.log('start');
        store.load('index', (err1, object1) => {
                if(err1){
                    store.add({id:'index', content:[id]}, err => {if (err) throw err });
                }else{
                    const content = object1.content;
                    content.push(id);
                    store.add({id:'index', content}, err => {if (err) throw err });
                }
                store.load(id, (err, object) => {
                    if(err)
                    {
                        store.add({id,state,time, past:[]}, err => {if (err) throw err });
                    } else{
                        const _state = object.state;
                        const _time = object.time;
                        const _past = object.past;

                        const diffMs = (time - new Date(_time));
                        const duration = (((diffMs % 86400000) % 3600000) / 60000).toFixed(2); // minutes

                        _past.unshift({state:_state, time:_time, duration:duration});
                        store.add({id,state,time, past:_past}, err => {if (err) throw err });
                    }

                });
            });
        
        res.status(200)
    } catch(err)
    {
        res.status(404)
        console.log(err)
    }
 })

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
  })