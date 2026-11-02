import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./components/homepage";
import Loginpage from "./components/loginpage";
import Admin from "./components/admin";
import Dashboard from "./components/dashboard";
import Raisecomplaint from "./components/raisecomplaint";
import Viewcomplaints from  "./components/viewcomplaints";
import ComplaintCard from  "./components/complaintcard";
import Trendingcomplaints from "./components/trendingcomplaints";
import StatisticsDashboard from "./components/statisticspage";
import Complaintdetails from "./components/complaintdetailspage"
import Signup from "./components/signup";
import Profile from "./components/profile";
import GenerateReport from "./components/generatereports";
import ReportResults from "./components/reportresults";
import ConversationRoom from "./components/conversationroom";
function App()
{
    return (

        <BrowserRouter>

    <Routes>

        <Route
            path="/"
            element={<Homepage />}
        />

        <Route
            path="/loginpage"
            element={<Loginpage />}
        />

        <Route
            path="/Admin"
            element={<Admin/>}
        />

        <Route
            path="/dashboard"
            element={<Dashboard />}
        />
        <Route
            path="/profile"
            element={<Profile/>}
        />
        <Route
            path="/raisecomplaint"
            element={<Raisecomplaint />}
        />

        <Route
            path="/viewcomplaint"
            element={<Viewcomplaints />}
        />

        <Route
         path="/StatisticsDashboard"
         element={<StatisticsDashboard/>}
        />

        <Route
         path="/GenerateReport"
         element={<GenerateReport/>}
        />

        <Route
         path="/reportresults"
         element={<ReportResults />}
        />

        <Route
         path="/complaintdetails"
         element={<Complaintdetails />}
        />

        <Route
          path="/ConversationRoom"
          element={<ConversationRoom/>}
        />

    </Routes>

</BrowserRouter>
    )
}

export default App;


