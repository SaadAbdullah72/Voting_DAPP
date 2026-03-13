import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Shield, Clock, Users, Activity, Wallet, Layout, ChevronRight, History } from 'lucide-react';
import Scene from './components/Scene';
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

    if (timeLeft === 0) return <span className="premium-badge badge-ended">ELECTION CONCLUDED</span>;
    
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    return (
        <span className="premium-badge badge-live">
            <Clock size={12} className="me-1" />
            {h}h {m}m {s}s LEFT
        </span>
    );
};

function App() {
    const [account, setAccount] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [elections, setElections] = useState([]);
    const [form, setForm] = useState({ title: '', desc: '', candidates: '', duration: '' });
    const [loading, setLoading] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);

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
            setShowAdminPanel(false);
        } catch (e) { alert("Error: " + e.reason); }
        setLoading(false);
    };

    const activeElections = elections.filter(e => e.endTime > Math.floor(Date.now() / 1000));
    const pastElections = elections.filter(e => e.endTime <= Math.floor(Date.now() / 1000));

    return (
        <div className="app-canvas overflow-hidden">
            <Scene />
            
            <nav className="glass-header px-4 py-3 sticky-top">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="d-flex align-items-center"
                    >
                        <div className="shield-logo me-2">
                            <Shield size={24} fill="#00d2ff" />
                        </div>
                        <h2 className="brand-logo m-0">VOTE<span className="text-accent">DAPP</span></h2>
                    </motion.div>

                    <div className="nav-actions d-flex gap-2 gap-md-3">
                        {isAdmin && (
                            <button className="btn-icon" onClick={() => setShowAdminPanel(!showAdminPanel)}>
                                <Plus size={20} />
                            </button>
                        )}
                        <button className="btn-wallet" onClick={connect}>
                            <Wallet size={18} className="me-0 me-md-2" />
                            <span className="d-none d-md-inline">{account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Connect"}</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container-fluid py-4 py-md-5 main-content">
                <AnimatePresence>
                    {showAdminPanel && isAdmin && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="glass-panel mx-auto mb-5 p-4 max-w-700"
                        >
                            <div className="panel-header d-flex justify-content-between align-items-center mb-4">
                                <h4 className="m-0 text-white d-flex align-items-center">
                                    <Activity size={20} className="me-2 text-info" />
                                    Launch New Election
                                </h4>
                                <button className="btn-close-panel" onClick={() => setShowAdminPanel(false)}>×</button>
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="p-label">Title</label>
                                    <input className="p-input" placeholder="Board Election" onChange={e => setForm({...form, title: e.target.value})} />
                                </div>
                                <div className="col-md-6">
                                    <label className="p-label">Duration (Min)</label>
                                    <input className="p-input" type="number" placeholder="60" onChange={e => setForm({...form, duration: e.target.value})} />
                                </div>
                                <div className="col-12">
                                    <label className="p-label">Candidates (Comma separated)</label>
                                    <input className="p-input" placeholder="Alice, Bob, Charlie" onChange={e => setForm({...form, candidates: e.target.value})} />
                                </div>
                                <div className="col-12">
                                    <label className="p-label">Description</label>
                                    <textarea className="p-input" rows="2" placeholder="Mandate details..." onChange={e => setForm({...form, desc: e.target.value})}></textarea>
                                </div>
                                <button className="btn-deploy mt-3" onClick={createElection} disabled={loading}>
                                    {loading ? "INITIALIZING ON CHAIN..." : "DEPLOY SMART CONTRACT"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="content-grid container">
                    {/* ACTIVE ELECTIONS */}
                    <div className="section-header d-flex align-items-center mb-4 mb-md-5">
                        <div className="pulse-dot me-3"></div>
                        <h3 className="section-title m-0">Live Governance</h3>
                    </div>

                    <div className="row g-4 g-md-5 mb-5">
                        {activeElections.length === 0 && (
                            <div className="col-12 text-center py-5">
                                <p className="text-muted">No live elections at the moment.</p>
                            </div>
                        )}
                        {activeElections.map((e, index) => (
                            <motion.div 
                                key={e.id} 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="col-xl-6"
                            >
                                <div className="premium-card">
                                    <div className="card-top d-flex justify-content-between align-items-start mb-4">
                                        <div className="title-area">
                                            <h4 className="election-title mb-1 text-truncate">{e.title}</h4>
                                            <p className="election-desc line-clamp-2">{e.desc}</p>
                                        </div>
                                        <Timer endTime={e.endTime} />
                                    </div>
                                    
                                    <div className="candidates-stack">
                                        {e.candidates.map((c, idx) => (
                                            <div key={idx} className="candidate-row">
                                                <div className="c-info">
                                                    <span className="c-name">{c.name}</span>
                                                    <div className="voter-stats d-flex align-items-center mt-1">
                                                        <Users size={12} className="me-1 opacity-50" />
                                                        <span className="c-votes">{c.votes}</span>
                                                    </div>
                                                </div>
                                                <button className="btn-cast" onClick={() => castVote(e.id, idx)}>
                                                    VOTE <ChevronRight size={14} className="d-none d-md-inline" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* PAST ELECTIONS */}
                    {pastElections.length > 0 && (
                        <>
                            <div className="section-header d-flex align-items-center mb-4 mt-5">
                                <History size={24} className="text-secondary me-3" />
                                <h3 className="section-title m-0 text-secondary">Historical Archive</h3>
                            </div>
                            <div className="row g-4">
                                {pastElections.map((e) => (
                                    <div key={e.id} className="col-lg-4">
                                        <div className="premium-card archive-card p-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5 className="m-0 text-truncate">{e.title}</h5>
                                                <Timer endTime={e.endTime} />
                                            </div>
                                            <div className="archive-stats d-flex justify-content-between">
                                                <span className="text-muted small">ID: #{e.id}</span>
                                                <span className="text-accent small font-monospace">CONCLUDED</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
export default App;
