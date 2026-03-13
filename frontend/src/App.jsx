import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShieldCheck, Clock, Users, Activity, Wallet, ChevronRight, History, Info, CheckCircle2 } from 'lucide-react';
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

    if (timeLeft === 0) return <span className="status-badge status-closed">Concluded</span>;
    
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    return (
        <span className="status-badge status-active">
            <Clock size={12} className="me-1" />
            {h}h {m}m {s}s
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
            confetti({ particleCount: 150, spread: 70, colors: ['#2563EB', '#3B82F6'] });
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
        <div className="app-professional">
            <div className="lighting-effect">
                <div className="glow-orb"></div>
            </div>
            
            <nav className="navbar-top">
                <div className="container d-flex justify-content-between align-items-center h-100">
                    <div className="brand-suite">
                        <ShieldCheck size={28} className="text-primary me-2" />
                        <h1 className="suite-name m-0">EthVote <span className="text-muted font-weight-light">Protocol</span></h1>
                    </div>
                    
                    <div className="nav-actions">
                        {isAdmin && (
                            <button className="btn-action-outline me-3" onClick={() => setShowAdminPanel(!showAdminPanel)}>
                                <Plus size={18} className="me-2" />
                                <span className="d-none d-md-inline">New Election</span>
                            </button>
                        )}
                        <button className="btn-primary-bold" onClick={connect}>
                            <Wallet size={18} className="me-2" />
                            {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Connect Wallet"}
                        </button>
                    </div>
                </div>
            </nav>

            <header className="hero-section text-center">
                <div className="container">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="hero-content"
                    >
                        <span className="hero-label">Official Blockchain Governance</span>
                        <h2 className="hero-title">The Future of Secure Digital Voting</h2>
                        <p className="hero-description">
                            EthVote Protocol provides a transparent, immutable, and tamper-proof electoral environment 
                            powered by Ethereum smart contracts. Launch elections, verify results, and participate 
                            in decentralized governance with absolute confidence.
                        </p>
                        <div className="hero-features d-flex justify-content-center gap-4 mt-5">
                            <div className="feature-item">
                                <CheckCircle2 size={16} className="text-success me-2" />
                                <span>Immutable Records</span>
                            </div>
                            <div className="feature-item">
                                <CheckCircle2 size={16} className="text-success me-2" />
                                <span>Zero Downtime</span>
                            </div>
                            <div className="feature-item">
                                <CheckCircle2 size={16} className="text-success me-2" />
                                <span>Instant Verification</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="container py-5 content-area">
                <AnimatePresence>
                    {showAdminPanel && isAdmin && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="admin-dashboard mb-5 overflow-hidden"
                        >
                            <div className="dashboard-card p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="m-0 d-flex align-items-center">
                                        <Activity size={20} className="text-primary me-2" />
                                        Election Manager
                                    </h4>
                                    <button className="btn-close-minimal" onClick={() => setShowAdminPanel(false)}>×</button>
                                </div>
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <label className="form-title">Election Title</label>
                                        <input className="form-control-custom" placeholder="e.g. 2026 Board Election" onChange={e => setForm({...form, title: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-title">Duration (Minutes)</label>
                                        <input className="form-control-custom" type="number" placeholder="60" onChange={e => setForm({...form, duration: e.target.value})} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-title">Candidates (Comma separated Names)</label>
                                        <input className="form-control-custom" placeholder="Saad, Abdullah, Khan" onChange={e => setForm({...form, candidates: e.target.value})} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-title">Mandate / Description</label>
                                        <textarea className="form-control-custom" rows="3" placeholder="Provide context for this election..." onChange={e => setForm({...form, desc: e.target.value})}></textarea>
                                    </div>
                                    <div className="col-12 text-end">
                                        <button className="btn-confirm-action h-100" onClick={createElection} disabled={loading}>
                                            {loading ? "Initializing..." : "Publish to Blockchain"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="section-suite mb-5">
                    <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                        <Activity size={20} className="text-primary me-2" />
                        <h3 className="section-heading m-0 text-dark">Active Elections</h3>
                    </div>

                    <div className="row g-4">
                        {activeElections.length === 0 && (
                            <div className="col-12 text-center py-5 empty-state">
                                <Info size={32} className="text-muted mb-3" />
                                <p className="text-muted mb-0">No governance sessions currently in progress.</p>
                            </div>
                        )}
                        {activeElections.map((e, index) => (
                            <motion.div 
                                key={e.id} 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="col-xl-6"
                            >
                                <div className="election-card-professional h-100">
                                    <div className="card-header-suite">
                                        <div className="title-block">
                                            <h4 className="card-election-title mb-1">{e.title}</h4>
                                            <p className="card-election-desc">{e.desc}</p>
                                        </div>
                                        <Timer endTime={e.endTime} />
                                    </div>
                                    
                                    <div className="card-candidates mt-4">
                                        {e.candidates.map((c, idx) => (
                                            <div key={idx} className="candidate-list-item">
                                                <div className="c-details">
                                                    <span className="c-name">{c.name}</span>
                                                    <div className="c-stats">
                                                        <Users size={12} className="me-1 opacity-50" />
                                                        <span>{c.votes} votes captured</span>
                                                    </div>
                                                </div>
                                                <button className="btn-vote-professional" onClick={() => castVote(e.id, idx)}>
                                                    Cast Vote <ChevronRight size={14} className="ms-1" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {pastElections.length > 0 && (
                    <div className="section-suite mt-5 pt-5">
                        <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                            <History size={20} className="text-muted me-2" />
                            <h3 className="section-heading m-0 text-muted">Historical Archive</h3>
                        </div>
                        <div className="row g-3">
                            {pastElections.map((e) => (
                                <div key={e.id} className="col-lg-4 col-md-6">
                                    <div className="archive-card-minimal p-4">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="m-0 text-dark font-weight-bold">{e.title}</h5>
                                            <span className="badge-concluded">ID: #{e.id}</span>
                                        </div>
                                        <div className="archive-metadata d-flex justify-content-between align-items-center mt-3">
                                            <span className="text-muted small">Election Concluded</span>
                                            <button className="btn-view-results" onClick={() => alert("Verification in Progress")}>Verify</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <footer className="footer-professional py-5 border-top">
                <div className="container text-center">
                    <ShieldCheck size={32} className="text-muted opacity-50 mb-3" />
                    <p className="m-0 text-muted small">&copy; 2026 EthVote Protocol. Built for Saad Abdullah. All transactions are final and immutable.</p>
                </div>
            </footer>
        </div>
    );
}
export default App;
