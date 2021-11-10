const getList = async () => await (await fetch('http://localhost:3300/getList')).json();
const getData = async (id) => await (await fetch(`http://localhost:3300/getStatus/${id}`)).json();

const fullList = {};
async function main() {
    console.log("main");
    $(".deviceList").empty();
    const list = (await getList()).data;
    list.forEach(async (id , index) => {
        const data = await getData(id);
        let duration = new Date() - new Date(data.time);
        duration = (((duration % 86400000) % 3600000) / 60000).toFixed(2); // minutes
        fullList[id] = [{data: data.state, time: data.time, duration},...data.past];      
        if(index === list.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
            Object.keys(fullList).forEach((device,idx) => {
                buildDevice(device.replaceAll('_',':'), fullList[device][0].data, 'Device '+idx, fullList[device][0].duration);
            });
        }
    });



}

const buildDevice = (id = "undefined", status = "ON" , title = "Device", time= 0) => {
    $(".deviceList").append(`
    <div class='deviceItem ${status}scale'> 
        <div class="${id}_title devicetitle"> ${title} </div>
        <div class="${id}_id deviceid"> ${id} </div>
        <div class="${id}_status devicestatus ${status}">${status}</div> 
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

    const ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'pie',
        data: {
        labels: ["Green", "Blue", "Gray", "Purple", "Yellow", "Red", "Black"],
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
            data: [12, 19, 3, 17, 28, 24, 7]
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
    setInterval(main, 15000);
}

$(document).ready(init);
