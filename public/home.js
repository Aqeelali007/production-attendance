const attendanceDiv = document.getElementById('attendance-data'); 
const bunkDiv = document.getElementById('bunkData');
const loading = document.getElementById('loading');
const layer = document.getElementById('overlay');

var flag;
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

        if (currentAttendance < 0.75) {
            const classesNeeded = Math.ceil((0.75 * total - attended) / 0.25);
            bunkDiv.innerHTML = `<p>You should attend ${classesNeeded} more classes to reach 75%.</p>`;
        } else {
            const classesCanBunk = Math.floor((attended - 0.75 * total) / 0.75);
            bunkDiv.innerHTML = `<p>You can bunk ${classesCanBunk} classes.</p>`;
        }
    } else {
        console.error("Total row not found in the table.");
        bunkDiv.innerHTML = '<p>Unable to calculate attendance insights.</p>';
    }
};

// Fetch attendance data from the server
const fetchAttendance = async () => {
    flag = true;

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
        const res = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials:'include',
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
    if (savedAttendanceTable && flag) {
        // Render saved data temporarily
        renderAttendance(savedAttendanceTable);
        flag = false;
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




// const attendanceTable = localStorage.getItem('attendanceTable'); 
// const attendanceDiv = document.getElementById('attendance-data'); 
// const bunkDiv = document.getElementById('bunkData');

// if (attendanceTable) { 
//     attendanceDiv.style.color = 'white';
//     attendanceDiv.innerHTML = attendanceTable; 

//     // Parse the HTML string into a DOM element
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(attendanceTable, 'text/html');

//     // Select the table row containing the "Total" data
//     const totalRow = doc.querySelector('table tbody tr:last-child');

//     if (totalRow) {
//         // Extract the second column (Cumulative data)
//         const cumulativeData = totalRow.querySelectorAll('td')[1].innerText;

//         // Split the data to get 284 and 393
//         const [attended, total] = cumulativeData.match(/\d+/g);
//         // console.log(attended);
//         // console.log(total);
//         const currentAttendance = attended/total;
//         if(currentAttendance < 0.75){
//             const classes = Math.round((0.75*total - attended)/0.25);
//             // console.log(classes);
//             bunkDiv.innerHTML = `<p>you should attend ${classes} more classes for 75%</p>`;
//         }
//         else{
//             const classesother = Math.round((((attended - 0.75 * total) / 0.75) * 100) / 100);
//             console.log(classesother);
//             bunkDiv.innerHTML = `you can bunk ${classesother} classes`;
//         }
        
//     } else {
//         console.error("Total row not found in the table.");
//     }
// } else { 
//     attendanceDiv.innerHTML = '<p>No attendance data found.</p>'; 
// }




// const loading = document.getElementById('loading');
// const layer = document.getElementById('overlay');

// document.addEventListener('load', async () => {
//     // event.preventDefault(); // Prevent the default form submission

//     // console.log('login button clicked');

//     loading.style.display = 'block';
//     layer.style.display = 'block';

//     const username = getCookie('client_username');
//     console.log(username);
//     const password = getCookie('client_password');
//     console.log(password);

//     try {
//     const res = await fetch('/submit', {
//         method: 'POST',
//         headers: {
//         'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ username, password })
//     });

//     const data = await res.json();
//     // console.log(data);
//     if (data.success) {
//         localStorage.setItem('attendanceData', JSON.stringify(data.attendanceData.studentId));            
//         localStorage.setItem('attendanceTable', data.attendanceData.tableHtml);            
//         window.location.href = '/attendance';
//     } else {
//         const warning = document.getElementById('invalid');
//         warning.innerHTML = 'Bad credentials';
//     }
//     } catch (error) {
//     console.error('Error:', error);
//     } finally {
//     //   console.log('gif stopped');  
//     layer.style.display = 'none';
//     loading.style.display = 'none';
//     }
// });
  
// // Function to get a cookie
// function getCookie(name) {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop().split(';').shift();
//     return null;
// }


// document.addEventListener('DOMContentLoaded', async () => {
//     const loading = document.getElementById('loading');
//     const layer = document.getElementById('overlay');
//     const attendanceDiv = document.getElementById('attendance-data'); 
//     // const bunkDiv = document.getElementById('bunkData');
//     const attendanceTable = localStorage.getItem('attendanceTable');

//     // Show loading GIF and overlay
//     console.log("start loading");
//     loading.style.display = 'block';
//     layer.style.display = 'block';

//     // Check if attendance data is already stored in localStorage
//     if (attendanceTable) {
//         displayAttendanceData(attendanceTable);
//     } else {
//         const username = getCookie('client_username');
//         console.log(username);
//         const password = getCookie('client_password');
//         console.log(password);

//         if (username && password) {
//             try {
//                 const res = await fetch('/submit', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify({ username, password })
//                 });

//                 const data = await res.json();
//                 if (data.success) {
//                     localStorage.setItem('attendanceData', JSON.stringify(data.attendanceData.studentId));
//                     localStorage.setItem('attendanceTable', data.attendanceData.tableHtml);
//                     displayAttendanceData(data.attendanceData.tableHtml);
//                 } else {
//                     attendanceDiv.innerHTML = '<p>Bad credentials</p>';
//                 }
//             } catch (error) {
//                 console.error('Error:', error);
//                 attendanceDiv.innerHTML = '<p>An error occurred while fetching attendance data.</p>';
//             } finally {
//                 // Hide the loading GIF and overlay
//                 console.log("hide loading");
//                 layer.style.display = 'none';
//                 loading.style.display = 'none';
//             }
//         } else {
//             attendanceDiv.innerHTML = '<p>No login credentials found.</p>';
//             // Hide the loading GIF and overlay
//             layer.style.display = 'none';
//             loading.style.display = 'none';
//         }
//     }
// });

// // Function to display attendance data
// function displayAttendanceData(attendanceTable) {
//     const attendanceDiv = document.getElementById('attendance-data');
//     const bunkDiv = document.getElementById('bunkData');

//     attendanceDiv.style.color = 'black';
//     attendanceDiv.innerHTML = attendanceTable;

//     // Parse the HTML string into a DOM element
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(attendanceTable, 'text/html');

//     // Select the table row containing the "Total" data
//     const totalRow = doc.querySelector('table tbody tr:last-child');

//     if (totalRow) {
//         // Extract the second column (Cumulative data)
//         const cumulativeData = totalRow.querySelectorAll('td')[1].innerText;

//         // Split the data to get 284 and 393
//         const [attended, total] = cumulativeData.match(/\d+/g);
//         const currentAttendance = attended / total;
//         if (currentAttendance < 0.75) {
//             const classes = Math.round((0.75 * total - attended) / 0.25);
//             bunkDiv.innerHTML = `<p>You should attend ${classes} more classes for 75%</p>`;
//         } else {
//             const classesOther = Math.round(((attended - 0.75 * total) / 0.75));
//             bunkDiv.innerHTML = `<p>You can bunk ${classesOther} classes</p>`;
//         }
//     } else {
//         console.error("Total row not found in the table.");
//     }
// }

// // Function to get a cookie
// function getCookie(name) {
    //     const value = `; ${document.cookie}`;
    //     const parts = value.split(`; ${name}=`);
    //     if (parts.length === 2) return parts.pop().split(';').shift();
    //     return null;
    // }



