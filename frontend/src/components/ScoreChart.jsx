import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LinearScale, PointElement, LineElement, CategoryScale, Tooltip, Legend } from 'chart.js'

ChartJS.register(LinearScale, PointElement, LineElement, CategoryScale, Tooltip, Legend)

export default function ScoreChart({ labels, scores }) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Score',
        data: scores,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.25)',
        tension: 0.35,
        fill: true
      }
    ]
  }

  const options = {
    responsive: true,
    scales: {
      y: {
        suggestedMin: 0,
        suggestedMax: 20
      }
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <Line data={data} options={options} />
    </div>
  )
}
