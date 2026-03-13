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
        <div className="vibe-wrapper-root">
            {/* Visual Atmosphere Layer */}
            <div className="vibe-wrapper">
                <div className="bloom-1"></div>
                <div className="bloom-2"></div>
            </div>

            {/* Navigation Layer */}
            <nav className="navbar">
                <div className="ui-container">
                    <div className="d-flex align-items-center w-100">
                        <div className="nav-logo">
                            <ShieldCheck size={28} className="text-primary" />
                            <span>EthVote</span>
                        </div>
                        
                        <div className="nav-actions">
                            {isAdmin && (
                                <button className="btn-base btn-outline" onClick={() => setShowAdminPanel(!showAdminPanel)}>
                                    <Plus size={18} />
                                    <span>New Election</span>
                                </button>
                            )}
                            <button className="btn-base btn-primary" onClick={connect}>
                                <Wallet size={18} />
                                <span>{account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Connect Wallet"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                {/* Hero Section */}
                <section className="hero">
                    <div className="ui-container">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <span className="hero-tag">Decentralized Governance</span>
                            <h1 className="hero-title text-gradient">The Future of Secure <br/> Digital Voting</h1>
                            <p className="hero-lead">
                                EthVote Protocol provides a transparent, immutable, and tamper-proof electoral environment 
                                powered by Ethereum. Launch elections and participate in governance with absolute confidence.
                            </p>
                        </motion.div>
                    </div>
                </section>

                <div className="ui-container">
                    <AnimatePresence>
                        {showAdminPanel && isAdmin && (
                            <motion.section 
                                initial={{ opacity: 0, scale: 0.98, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                                className="admin-manager"
                            >
                                <div className="glass-panel">
                                    <div className="d-flex justify-content-between align-items-center mb-5">
                                        <div className="d-flex align-items-center gap-3">
                                            <Activity size={24} className="text-primary" />
                                            <h3 className="m-0 font-weight-bold">Election Manager</h3>
                                        </div>
                                        <button className="btn-close-minimal" onClick={() => setShowAdminPanel(false)}>×</button>
                                    </div>

                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label">Election Title</label>
                                                <input className="form-input" placeholder="e.g. 2026 Board Election" onChange={e => setForm({...form, title: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label">Duration (Minutes)</label>
                                                <input className="form-input" type="number" placeholder="60" onChange={e => setForm({...form, duration: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-group">
                                                <label className="form-label">Candidates (Comma separated)</label>
                                                <input className="form-input" placeholder="Saad, Abdullah, Khan" onChange={e => setForm({...form, candidates: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-group">
                                                <label className="form-label">Election Mandate</label>
                                                <textarea className="form-input" rows="3" placeholder="Describe the purpose of this election..." onChange={e => setForm({...form, desc: e.target.value})}></textarea>
                                            </div>
                                        </div>
                                        <div className="col-12 mt-4">
                                            <button className="btn-base btn-primary w-100 justify-content-center py-3" onClick={createElection} disabled={loading}>
                                                {loading ? "Initializing..." : "Publish to Blockchain"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* Active Elections Grid */}
                    <section className="election-section">
                        <div className="section-title">
                            <span></span>
                            <h3>Live Governance Sessions</h3>
                        </div>

                        <div className="ui-grid-12">
                            {activeElections.length === 0 && (
                                <div className="col-12 glass-panel text-center py-5">
                                    <Info size={40} className="text-tertiary mb-3" />
                                    <p className="text-secondary mb-0">No active governance sessions in progress.</p>
                                </div>
                            )}
                            {activeElections.map((e, index) => (
                                <motion.div 
                                    key={e.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="election-card glass-panel"
                                >
                                    <div className="card-top">
                                        <div className="title-block">
                                            <h4 className="m-0 mb-1">{e.title}</h4>
                                            <p className="text-secondary small mb-0 line-clamp-2">{e.desc}</p>
                                        </div>
                                        <Timer endTime={e.endTime} />
                                    </div>
                                    
                                    <div className="candidates-stack mt-auto">
                                        {e.candidates.map((c, idx) => (
                                            <div key={idx} className="candidate-row">
                                                <div className="c-details">
                                                    <span className="c-name">{c.name}</span>
                                                    <div className="d-flex align-items-center gap-1 opacity-50 mt-1">
                                                        <Users size={12} />
                                                        <span className="c-votes">{c.votes} votes</span>
                                                    </div>
                                                </div>
                                                <button className="btn-base btn-outline py-2" onClick={() => castVote(e.id, idx)}>
                                                    <span>Vote</span>
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Historical Grid */}
                    {pastElections.length > 0 && (
                        <section className="election-section mt-5">
                            <div className="section-title">
                                <History size={24} className="text-tertiary" />
                                <h3 className="text-secondary">Historical Archive</h3>
                            </div>
                            <div className="row g-4">
                                {pastElections.map((e) => (
                                    <div key={e.id} className="col-lg-4 col-md-6">
                                        <div className="glass-panel p-4 h-100">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5 className="m-0 font-weight-bold">{e.title}</h5>
                                                <span className="badge-concluded opacity-50 small">#{e.id}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mt-4">
                                                <span className="text-tertiary small">Concluded</span>
                                                <button className="btn-base btn-outline py-1 px-3 text-micro" onClick={() => alert("Verification Hash: 0x...")}>Verify</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            <footer className="footer py-5 border-top border-subtle mt-5">
                <div className="ui-container text-center">
                    <ShieldCheck size={32} className="text-tertiary opacity-30 mb-4" />
                    <p className="m-0 text-tertiary small">
                        &copy; 2026 EthVote Protocol. Built by Saad Abdullah. <br/> 
                        Transactions are immutable and verifiable on-chain.
                    </p>
                </div>
            </footer>
        </div>
    );
}
export default App;
