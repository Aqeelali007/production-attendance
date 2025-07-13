const attendanceDiv = document.getElementById('attendance-data'); 
const bunkDiv = document.getElementById('bunkData');
const loading = document.getElementById('loading');
const layer = document.getElementById('overlay');
const custom = document.getElementById('custom');
const button = document.getElementsByClassName('customBtn')[0];
// const baseUrl =
//    window.location.hostname === "localhost"
//        ? "http://localhost:3000" // Adjust port to match your local server
//        : "https://vnr-attendance-aa-94bx.vercel.app";

//var flag;
// Show a placeholder while fetching updated data
attendanceDiv.style.color = 'black';
attendanceDiv.innerHTML = '<p>Fetching the latest attendance data...</p>';

// Function to render attendance data
const renderAttendance = (attendanceTable) => {
    attendanceDiv.innerHTML = attendanceTable;

    const parser = new DOMParser();
    const doc = parser.parseFromString(attendanceTable, 'text/html');

    const totalRow = doc.querySelector('table tbody tr:last-child');
    if (totalRow) {
        const cumulativeData = totalRow.querySelectorAll('td')[1].innerText;
        const [attended, total] = cumulativeData.match(/\d+/g).map(Number);
        const currentAttendance = attended / total;
        const trunAttendance = Math.floor(currentAttendance * 10000)/100;

        if (currentAttendance < 0.75) {
            const classesNeeded = Math.ceil((0.75 * total - attended) / 0.25);
            bunkDiv.innerHTML = `<p>Current Attendance is ${trunAttendance}%.<br>You should attend ${classesNeeded} more classes to reach 75%.</p> `;
        } else {
            const classesCanBunk = Math.floor((attended - 0.75 * total) / 0.75);
            bunkDiv.innerHTML = `<p>Current Attendance is ${trunAttendance}%.<br>You can bunk ${classesCanBunk} classes.</p>`;
        }
        button.addEventListener('click',()=>{
            const classes = Number(document.getElementById('box').value);
            console.log(classes);
            const totalClasses = Number(document.getElementById('box1').value);
            console.log(totalClasses);
            console.log(attended);
            console.log(total);
            if(classes <= totalClasses){

                const final = ((totalClasses - classes + attended)/(total + totalClasses));
                const formattedFinalAttendance = Math.floor(final * 10000) / 100;
                custom.innerHTML = `<p>attendance will be ${formattedFinalAttendance}%</p>`;
            }
            else{
                custom.innerHTML = `<p>Ensure number of classes are correct</p>`;
            }
        });
    } else {
        console.error("Total row not found in the table.");
        bunkDiv.innerHTML = '<p>Unable to calculate attendance insights.</p>';
    }
};

// Fetch attendance data from the server
const fetchAttendance = async () => {

    loading.style.display = 'block';
    layer.style.display = 'block';

    const username = getCookie('username');
    // console.log(username);
    const password = getCookie('password');
    // console.log(password);

    if (!username || !password) {
        console.error("Username or password not found in cookies.");
        attendanceDiv.innerHTML = '<p>Please log in again.</p>';
        loading.style.display = 'none';
        layer.style.display = 'none';
        return;
    }

    try {
        const res = await fetch(`/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (data.success) {
            // Update localStorage and render new data
            localStorage.setItem('attendanceTable', data.attendanceData.tableHtml);
            renderAttendance(data.attendanceData.tableHtml);
        } else {
            attendanceDiv.innerHTML = '<p>Failed to fetch attendance. Please log in again.</p>';
        }
    } catch (error) {
        console.error('Error fetching attendance:', error);
        attendanceDiv.innerHTML = '<p>An error occurred. Please try again later.</p>';
    } finally {
        // console.log("loading gif stop");
        loading.style.display = 'none';
        layer.style.display = 'none';
    }
};

// Check for saved attendance data and fetch updated data
window.onload = async () => {
    const savedAttendanceTable = localStorage.getItem('attendanceTable');
    const flag = localStorage.getItem('flag');
    if (savedAttendanceTable && flag) {
        // Render saved data temporarily
        renderAttendance(savedAttendanceTable);
        localStorage.removeItem('flag');
    }
    else{
        // Fetch the latest data
        await fetchAttendance();
    }
};

// Function to get a cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return null;
}
