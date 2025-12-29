// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiElection {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 endTime;
        bool isActive;
        string[] candidateNames;
        mapping(uint256 => uint256) voteCounts;
        mapping(address => bool) hasVoted;
    }

    address public admin;
    uint256 public electionCount;
    mapping(uint256 => Election) private elections;

    event ElectionCreated(uint256 id, string title, uint256 endTime);
    event VoteCast(uint256 electionId, address voter, uint256 candidateIndex);

    constructor() {
        admin = msg.sender;
    }

    function createElection(
        string memory _title, 
        string memory _desc, 
        string[] memory _candidates, 
        uint256 _durationMinutes
    ) public {
        require(msg.sender == admin, "Sirf admin bana sakta hai");
        electionCount++;
        
        Election storage newEth = elections[electionCount];
        newEth.id = electionCount;
        newEth.title = _title;
        newEth.description = _desc;
        newEth.endTime = block.timestamp + (_durationMinutes * 1 minutes);
        newEth.isActive = true;
        newEth.candidateNames = _candidates;

        emit ElectionCreated(electionCount, _title, newEth.endTime);
    }

    function vote(uint256 _electionId, uint256 _candidateIndex) public {
        Election storage e = elections[_electionId];
        require(e.isActive, "Election band hai");
        require(block.timestamp < e.endTime, "Waqt khatam ho gaya");
        require(!e.hasVoted[msg.sender], "Aap pehle hi vote de chuke hain");
        require(_candidateIndex < e.candidateNames.length, "Galat candidate");

        e.voteCounts[_candidateIndex]++;
        e.hasVoted[msg.sender] = true;

        emit VoteCast(_electionId, msg.sender, _candidateIndex);
    }

    function getElectionBase(uint256 _id) public view returns (
        string memory title, 
        string memory desc, 
        uint256 endTime, 
        bool active, 
        string[] memory names
    ) {
        Election storage e = elections[_id];
        return (e.title, e.description, e.endTime, e.isActive, e.candidateNames);
    }

    function getCandidateVotes(uint256 _id, uint256 _cIndex) public view returns (uint256) {
        return elections[_id].voteCounts[_cIndex];
    }
}