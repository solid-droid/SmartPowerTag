const getList = async () => await (await fetch('http://localhost:3300/getList')).json();
const getData = async (id) => await (await fetch(`http://localhost:3300/getStatus/${id}`)).json();

const fullList = {};
async function main() {

    const list = (await getList()).data;
    list.forEach(async (id) => {
        const data = await getData(id);
        let duration = new Date() - new Date(data.time);
        duration = (((duration % 86400000) % 3600000) / 60000).toFixed(2); // minutes
        fullList[id] = [{data: data.state, time: data.time, duration},...data.past];
        console.log(fullList);
    });

}

main();
