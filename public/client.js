// const baseUrl =
//     window.location.hostname === "localhost"
//         ? "http://localhost:3000" // Adjust port to match your local server
//         : "https://your-backend-domain.vercel.app"; // Replace with your Vercel backend URL


document.addEventListener('DOMContentLoaded', () => {
  const submitButton = document.getElementById('submit');
  const loading = document.getElementById('loading');
  const layer = document.getElementById('overlay');

  submitButton.addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    // console.log('login button clicked');

    loading.style.display = 'block';
    layer.style.display = 'block';

    const username = document.getElementById('username').value;
    // console.log(username);
    const password = document.getElementById('password').value;
    // console.log(password);

    try {
      const res = await fetch(`/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials:'include',
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      // console.log(data);
      if (data.success) {
        localStorage.setItem('attendanceData', JSON.stringify(data.attendanceData.studentId));            
        localStorage.setItem('attendanceTable', data.attendanceData.tableHtml);            
        window.location.href = '/attendance';
      } else {
        const warning = document.getElementById('invalid');
        warning.innerHTML = 'Bad credentials';
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
    //   console.log('gif stopped');  
      layer.style.display = 'none';
      loading.style.display = 'none';
    }
  });
});

