import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LinearScale, PointElement, LineElement, CategoryScale, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(LinearScale, PointElement, LineElement, CategoryScale, Tooltip, Legend, Filler)

export default function ScoreChart({ labels, scores }) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Score Performance',
        data: scores,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#22d3ee',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          },
          stepSize: 2
        },
        suggestedMin: 0,
        suggestedMax: 10
      }
    }
  }

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  )
}
