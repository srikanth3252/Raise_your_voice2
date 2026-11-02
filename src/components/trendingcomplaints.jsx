import { useEffect, useState } from "react";
import ComplaintCard from "./complaintcard";

import "../styles/viewcomplaints.css";

function Trendingcomplaints()
{
    const [complaints, setcomplaints] = useState([]);

    useEffect(() =>
    {
        gettrendingcomplaints();
    }, []);

    async function gettrendingcomplaints()
    {
        try
        {
            let res = await fetch(
                "https://raise-your-voice2.onrender.com/gettrendingcomplaints"
            );

            let data = await res.json();

            console.log(data);

            setcomplaints(data);
        }
        catch(err)
        {
            console.log(err.message);
        }
    }

    return (
    <>
        <div className="header">
             <h1>View Top 10 trending Complaints</h1>
             <p>See ongoing, pending, and resolved concerns raised by students.</p>
        </div>

        <div className="complaints-container">
            {complaints.map((complaint) => (
                <ComplaintCard
                    key={complaint.complaint_id}
                    complaint={complaint}
                />
            ))}
        </div>
    </>
);
}

export default Trendingcomplaints;