// Wait for the DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Line Chart
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    const lineChart = new Chart(lineCtx, {
        type: 'line', // Specify chart type
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June'], // X-axis labels
            datasets: [{
                label: 'Sales Over Time', // Dataset label
                data: [120, 190, 300, 500, 200, 300], // Data points
                backgroundColor: 'rgba(74, 144, 226, 0.2)', // Fill color below the line
                borderColor: 'rgba(74, 144, 226, 1)', // Line color
                borderWidth: 2, // Line width
                tension: 0.4 // Curvature of the line
            }]
        },
        options: {
            responsive: true, // Chart responsiveness
            animation: {
                duration: 1000, // Animation duration in ms
                easing: 'easeInOutQuart' // Animation easing function
            },
            plugins: {
                legend: {
                    display: true, // Display the legend
                    position: 'top' // Position of the legend
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false // Hide vertical grid lines
                    }
                },
                y: {
                    grid: {
                        color: '#eaeaea' // Grid line color
                    },
                    beginAtZero: true // Y-axis starts at zero
                }
            }
        }
    });

    // Initialize Bar Chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    const barChart = new Chart(barCtx, {
        type: 'bar', // Specify chart type
        data: {
            labels: ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'], // X-axis labels
            datasets: [{
                label: 'Browser Usage', // Dataset label
                data: [65, 59, 80, 81, 56], // Data points
                backgroundColor: [ // Bar colors
                    'rgba(74, 144, 226, 0.8)',
                    'rgba(80, 227, 194, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderColor: [ // Border colors for bars
                    'rgba(74, 144, 226, 1)',
                    'rgba(80, 227, 194, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1 // Border width
            }]
        },
        options: {
            responsive: true, // Chart responsiveness
            animation: {
                duration: 1000, // Animation duration in ms
                easing: 'easeInOutQuart' // Animation easing function
            },
            plugins: {
                legend: {
                    display: false // Hide the legend
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false // Hide vertical grid lines
                    }
                },
                y: {
                    grid: {
                        color: '#eaeaea' // Grid line color
                    },
                    beginAtZero: true // Y-axis starts at zero
                }
            }
        }
    });
});