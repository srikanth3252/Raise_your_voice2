import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FileText,
  Clock,
  LoaderCircle,
  CheckCircle,
  ThumbsUp,
  Users,
  TrendingUp,
  RefreshCw,
  FileChartColumn,
  AlertCircle
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

import "../styles/statisticspage.css";

const COLORS = ["#f5b94c", "#8d83ff", "#39c98a"];

function StatisticsDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchStatistics() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:2000/statisticsdashboard"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch statistics");
      }

      setStats(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="sd-page sd-center">
        <RefreshCw className="sd-spin" size={30} />
        <p>Loading dashboard statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sd-page sd-center">
        <AlertCircle size={30} color="#ff8e9c" />
        <h3>Unable to load statistics</h3>
        <p>{error}</p>
        <button className="sd-primary-btn" onClick={fetchStatistics}>
          Try Again
        </button>
      </div>
    );
  }

  const overview = stats.overview;

  const cards = [
    {
      title: "Total Complaints",
      value: overview.totalComplaints,
      icon: FileText,
      color: "blue"
    },
    {
      title: "Pending",
      value: overview.pending,
      icon: Clock,
      color: "orange"
    },
    {
      title: "In Progress",
      value: overview.inProgress,
      icon: LoaderCircle,
      color: "purple"
    },
    {
      title: "Resolved",
      value: overview.resolved,
      icon: CheckCircle,
      color: "green"
    },
    {
      title: "Total Supports",
      value: overview.totalSupports,
      icon: ThumbsUp,
      color: "cyan"
    },
    {
      title: "Registered Users",
      value: overview.totalUsers,
      icon: Users,
      color: "pink"
    }
  ];

  const statusData = [
    { name: "Pending", value: overview.pending },
    { name: "In Progress", value: overview.inProgress },
    { name: "Resolved", value: overview.resolved }
  ];

  return (
    <div className="sd-page">

      {/* HEADER */}
      <div className="sd-header">
        <div>
          <span className="sd-eyebrow">
            RAISE YOUR VOICE / ANALYTICS
          </span>

          <h1>Statistics Dashboard</h1>

          <p>
            Monitor complaint activity and university grievance trends.
          </p>
        </div>

        <div className="sd-header-actions">
          <button
            className="sd-secondary-btn"
            onClick={fetchStatistics}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="sd-primary-btn"
            onClick={() => navigate("/GenerateReport")}
          >
            <FileChartColumn size={16} />
            Generate Reports
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="sd-card-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="sd-card" key={card.title}>
              <div className={`sd-card-icon ${card.color}`}>
                <Icon size={22} />
              </div>

              <div>
                <p>{card.title}</p>
                <h2>{card.value}</h2>
              </div>
            </div>
          );
        })}
      </div>

      {/* RESOLUTION RATE */}
      <div className="sd-resolution-panel">
        <div>
          <span>COMPLAINT RESOLUTION RATE</span>
          <h2>{overview.resolutionRate}%</h2>
          <p>
            {overview.resolved} out of {overview.totalComplaints} complaints
            have been resolved.
          </p>
        </div>

        <div className="sd-resolution-track">
          <div
            className="sd-resolution-fill"
            style={{
              width: `${overview.resolutionRate}%`
            }}
          />
        </div>
      </div>

      {/* CHARTS */}
      <div className="sd-chart-grid">

        {/* STATUS CHART */}
        <div className="sd-panel">
          <div className="sd-panel-heading">
            <h2>Complaint Status</h2>
            <p>Distribution by current status</p>
          </div>

          {overview.totalComplaints === 0 ? (
            <div className="sd-empty">
              No complaint data available.
            </div>
          ) : (
            <div className="sd-pie-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background: "#172943",
                      border: "1px solid #354b6b",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="sd-legend">
            {statusData.map((item, index) => (
              <div key={item.name}>
                <span>
                  <i style={{ background: COLORS[index] }} />
                  {item.name}
                </span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* MONTHLY CHART */}
        <div className="sd-panel">
          <div className="sd-panel-heading">
            <h2>Monthly Complaints</h2>
            <p>Complaint submissions over six months</p>
          </div>

          {stats.monthly.length === 0 ? (
            <div className="sd-empty">
              No monthly complaint data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <BarChart
                data={stats.monthly}
                margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#91a3c1", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#91a3c1", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#172943",
                    border: "1px solid #354b6b",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#5288f4"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* CATEGORY */}
      <div className="sd-panel sd-category-panel">
        <div className="sd-panel-heading">
          <h2>Complaints by Category</h2>
          <p>Identify the areas receiving the most complaints</p>
        </div>

        {stats.categories.length === 0 ? (
          <div className="sd-empty">
            No category data available.
          </div>
        ) : (
          <div className="sd-category-list">
            {stats.categories.map((item) => {
              const percentage =
                overview.totalComplaints > 0
                  ? (Number(item.count) / overview.totalComplaints) * 100
                  : 0;

              return (
                <div className="sd-category-item" key={item.category}>
                  <div className="sd-category-heading">
                    <span>{item.category}</span>
                    <strong>{item.count}</strong>
                  </div>

                  <div className="sd-category-track">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="sd-category-fill"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TOP COMPLAINTS */}
      <div className="sd-panel sd-top-panel">
        <div className="sd-panel-heading">
          <h2>Most Supported Complaints</h2>
          <p>Top five complaints based on student support</p>
        </div>

        {stats.topComplaints.length === 0 ? (
          <div className="sd-empty">
            No complaints available.
          </div>
        ) : (
          <div className="sd-table-wrapper">
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Supports</th>
                </tr>
              </thead>

              <tbody>
                {stats.topComplaints.map((item) => (
                  <tr key={item.complaint_id}>
                    <td>#{item.complaint_id}</td>
                    <td>{item.title}</td>
                    <td>{item.category}</td>
                    <td>{item.status}</td>
                    <td>
                      <span className="sd-support-count">
                        <ThumbsUp size={14} />
                        {item.total_likes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="sd-footer">
        <span>Raise Your Voice · Statistics</span>
        <span>Data fetched from MySQL database</span>
      </div>

    </div>
  );
}

export default StatisticsDashboard;