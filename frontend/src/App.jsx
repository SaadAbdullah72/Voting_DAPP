import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const CONTRACT_ADDRESS = "0xfe02362a216F574137f09A909c26B161e4ba1964";
const ABI = [
    "function admin() view returns (address)",
    "function electionCount() view returns (uint256)",
    "function createElection(string title, string desc, string[] candidates, uint256 duration) public",
    "function vote(uint256 electionId, uint256 candidateIndex) public",
    "function getElectionBase(uint256 id) view returns (string title, string desc, uint256 endTime, bool active, string[] names)",
    "function getCandidateVotes(uint256 id, uint256 cIndex) view returns (uint256)"
];

const Timer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            setTimeLeft(endTime > now ? endTime - now : 0);
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    if (timeLeft === 0) return <span className="status-tag status-ended">CONCLUDED</span>;
    
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    return <span className="status-tag status-live">{h}h {m}m {s}s remaining</span>;
};

function App() {
    const [account, setAccount] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [elections, setElections] = useState([]);
    const [form, setForm] = useState({ title: '', desc: '', candidates: '', duration: '' });
    const [loading, setLoading] = useState(false);

    const connect = async () => {
        if (!window.ethereum) return alert("Please install MetaMask extension.");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        const admin = await contract.admin();
        setIsAdmin(admin.toLowerCase() === address.toLowerCase());
        loadElections(contract);
    };

    const loadElections = async (contract) => {
        const count = await contract.electionCount();
        let list = [];
        for (let i = 1; i <= count; i++) {
            const data = await contract.getElectionBase(i);
            let candidatesWithVotes = [];
            for (let j = 0; j < data[4].length; j++) {
                const v = await contract.getCandidateVotes(i, j);
                candidatesWithVotes.push({ name: data[4][j], votes: v.toString() });
            }
            list.push({ 
                id: i, 
                title: data[0], 
                desc: data[1], 
                endTime: Number(data[2]), 
                candidates: candidatesWithVotes 
            });
        }
        setElections(list.reverse());
    };

    const castVote = async (eId, cIdx) => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            const tx = await contract.vote(eId, cIdx);
            await tx.wait();
            confetti({ particleCount: 150, spread: 70, colors: ['#00d2ff', '#9d50bb'] });
            loadElections(contract);
        } catch (e) {
            alert("Vote Failed: " + (e.reason || "Already voted or session expired."));
        }
    };

    const createElection = async () => {
        if(!form.title || !form.candidates || !form.duration) return alert("Please fill all fields");
        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            const candArray = form.candidates.split(',').map(s => s.trim());
            const tx = await contract.createElection(form.title, form.desc, candArray, form.duration);
            await tx.wait();
            confetti({ particleCount: 200, spread: 100 });
            loadElections(contract);
        } catch (e) { alert("Error: " + e.reason); }
        setLoading(false);
    };

    return (
        <div className="app-container font-inter">
            <nav className="navbar navbar-dark bg-transparent border-bottom border-secondary px-4 py-3 sticky-top glass-nav">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <h2 className="logo-brand m-0">ETH VOTE <span className="pro-badge">PRO</span></h2>
                    <button className="btn-connect" onClick={connect}>
                        {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Connect Wallet"}
                    </button>
                </div>
            </nav>

            <div className="container py-5">
                {isAdmin && (
                    <div className="admin-section fade-in mb-5 p-4 glass-card shadow-lg">
                        <h4 className="section-header text-info mb-4">
                            <span className="icon">🛠</span> Management Dashboard
                        </h4>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="label-text">Electoral Title</label>
                                <input className="input-field" placeholder="e.g. Board of Directors" onChange={e => setForm({...form, title: e.target.value})} />
                            </div>
                            <div className="col-md-6">
                                <label className="label-text">Timeframe (Minutes)</label>
                                <input className="input-field" type="number" placeholder="e.g. 120" onChange={e => setForm({...form, duration: e.target.value})} />
                            </div>
                            <div className="col-12">
                                <label className="label-text">Candidates (Separated by Commas)</label>
                                <input className="input-field" placeholder="Apple, Microsoft, Google" onChange={e => setForm({...form, candidates: e.target.value})} />
                            </div>
                            <div className="col-12">
                                <label className="label-text">Objective / Description</label>
                                <textarea className="input-field" rows="2" placeholder="Define the purpose of this election..." onChange={e => setForm({...form, desc: e.target.value})}></textarea>
                            </div>
                            <button className="btn-execute w-100" onClick={createElection} disabled={loading}>
                                {loading ? "Broadcasting to Chain..." : "DEPLOY NEW ELECTION"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="d-flex align-items-center mb-4">
                    <div className="live-indicator me-3"></div>
                    <h3 className="section-title m-0">Active Electoral Sessions</h3>
                </div>

                <div className="row g-4">
                    {elections.length === 0 && <p className="text-muted text-center py-5">No active sessions found on chain.</p>}
                    {elections.map(e => (
                        <div key={e.id} className="col-lg-6">
                            <div className="election-card-premium shadow-lg">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h4 className="title-text m-0">{e.title}</h4>
                                    <Timer endTime={e.endTime} />
                                </div>
                                <p className="desc-text mb-4">{e.desc}</p>
                                <div className="candidate-grid">
                                    {e.candidates.map((c, idx) => (
                                        <div key={idx} className="candidate-item d-flex justify-content-between align-items-center">
                                            <div className="info">
                                                <div className="name">{c.name}</div>
                                                <div className="count">{c.votes} <small>VOTES</small></div>
                                            </div>
                                            <button className="btn-vote" onClick={() => castVote(e.id, idx)}>Cast Vote</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default App;