const getList = async () => await (await fetch('http://localhost:3300/getList')).json();
const getData = async (id) => await (await fetch(`http://localhost:3300/getStatus/${id}`)).json();
var myChart1, myChart2;
var watt = [50, 10, 10]
const fullList = {};
async function main() {
    const list = (await getList()).data;
    list.forEach(async (id , index) => {
        const data = await getData(id);
        let duration = new Date() - new Date(data.time);
        duration = (((duration % 86400000) % 3600000) / 60000).toFixed(2); // minutes
        fullList[id] = [{data: data.state, smoke: data.smoke, time: data.time, duration},...data.past]; 
        if(index === list.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
            $(".deviceList").empty();

            myChart1.data.labels = [];
            myChart2.data.labels = [];
   
            let OnTimeList = [];
            Object.keys(fullList).forEach((device,idx) => {
                myChart1.data.labels.push('Device '+idx+' ');
                myChart2.data.labels.push('Device '+idx+' ');
                
                const OnTime = fullList[device].filter(x =>  x.state == 'ON' || x.data == 'ON')
                                            .map( x => parseFloat(x.duration))
                                            .reduce((a , b) => a + b);

                OnTimeList.push(OnTime);

                buildDevice(device.replaceAll('_',':'), fullList[device][0].data, fullList[device][0].smoke, 'Device '+idx, fullList[device][0].duration);
            });

            const total = OnTimeList.reduce((a,b)=>a+b);
            let wattTime = OnTimeList.map((x,i) => x*watt[i]);
            const totalWatt = wattTime.reduce((a,b)=>a+b);
            OnTimeList = OnTimeList.map(x => Math.round(100*x/total));
            wattTime = wattTime.map(x => Math.round(100*x/totalWatt));
            myChart1.data.datasets[0].data= OnTimeList;
            myChart2.data.datasets[0].data= wattTime;
            myChart1.update();
            myChart2.update();
        }
    });



}

const buildDevice = (id = "undefined", status = "ON" , smoke = "OFF", title = "Device", time= 0) => {
    $(".deviceList").append(`
    <div class='deviceItem scale'> 
        <div class="${id}_title devicetitle"> ${title} </div>
        <div class="${id}_id deviceid"> ${id} </div>
        <div class="${id}_status devicestatus ${smoke == 'OFF' ? status : 'RED'}">
        <div class="state">${status}</div>
        <div class="smoke">${smoke == 'OFF' ? 'No Smoke' : 'Smoke Detected'}</div>
        </div> 
        <div class="${id}_time devicetime">${status} for ${time} Mts</div>
    </div>`);
}


const init = () => {
    
    const removeActive = () => [...document.querySelectorAll('.active')].forEach(el => el.classList.remove('active'));

    $('.devices').click(() => {
        $('.content2').hide();
        $('.content3').hide();
        $('.content1').show();
        removeActive();
        $('.btn1').addClass("active");
    });

    $('.analytics').click(() => {
        $('.content1').hide();
        $('.content3').hide();
        $('.content2').show();
        removeActive();
        $('.btn3').addClass("active");
    });

    $('.camera').click(() => {
        $('.content1').hide();
        $('.content3').show();
        $('.content2').hide();
        removeActive();
        $('.btn2').addClass("active");
    });

    const ctx1 = document.getElementById('myChart1').getContext('2d');
    myChart1 = new Chart(ctx1, {
        type: 'pie',
        data: {
        labels: [],

        datasets: [{
            backgroundColor: [
                "#2ecc71",
                "#3498db",
                "#95a5a6",
                "#9b59b6",
                "#f1c40f",
                "#e74c3c",
                "#34495e"
                ],
            data: []
        }]
        },
        options: {
            plugins: {
                legend: {
                display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    const ctx2 = document.getElementById('myChart2').getContext('2d');
    myChart2 = new Chart(ctx2, {
        type: 'pie',
        data: {
        labels: [],
        datasets: [{
            backgroundColor: [
                "#2ecc71",
                "#3498db",
                "#95a5a6",
                "#9b59b6",
                "#f1c40f",
                "#e74c3c",
                "#34495e"
                ],
            data: []
        }]
        },
        options: {
            plugins: {
                legend: {
                display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });
    main();
    setInterval(main, 5000);
}

$(document).ready(init);
