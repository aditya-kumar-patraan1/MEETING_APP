import React, { useEffect, useCallback, useState } from "react";
import { CiMicrophoneOff } from "react-icons/ci";
import { BiSolidCameraOff } from "react-icons/bi";
import { MdOutlineCallEnd } from "react-icons/md";
import { FaCamera } from "react-icons/fa";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import { IoSend } from "react-icons/io5";
import { Toaster, toast } from "react-hot-toast";
import { CiMicrophoneOn } from "react-icons/ci";
import "../App.css";
import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export const LeftSide = ({ room, email, isDark, setIsDark }) => {
  const socket = useSocket();
  const Navigate = useNavigate();
  const [mySocket, setmySocket] = useState();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currMsg, setcurrMsg] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const toggleMic = () => {
    if (!myStream) return;
    myStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    });
  };

  useEffect(() => {
    if (socket) {
      setmySocket(socket.id);
    }
  }, [socket]);

  const toggleCamera = () => {
    if (!myStream) return;
    const newCameraState = !cameraOn;
    myStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setCameraOn(newCameraState);
    socket.emit("camera:toggle", { to: remoteSocketId, email, newCameraState });
  };

  const cutCall = () => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
    }
    setMyStream(null);
    setRemoteStream(null);
    socket.emit("call:ended", { to: remoteSocketId });
    toast("📴 Call Ended");
    Navigate("/");
  };

  const handleUserJoined = useCallback(({ email, id }) => {
    // console.log(`Email ${email} joined room`);
    toast.success(`${email} joined the Meeting..`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    const { from, offer } = incomingCall;
    setShowPrompt(false);
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
    const ans = await peer.getAnswer(offer);
    socket.emit("call:accepted", { to: from, ans });
  };

  const handleDeclineCall = () => {
    setShowPrompt(false);
    setIncomingCall(null);
  };

  const renderAcceptDeclinePrompt = () => {
    if (!showPrompt) return null;

    return (
      <div className="fixed top-0 left-0 w-full h-full backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
          <p className="text-lg font-semibold text-gray-800">
            Incoming Call...
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleAcceptCall}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200 hover:scale-90 hover:active:scale-80 transform cursor-pointer"
            >
              Accept
            </button>
            <button
              onClick={handleDeclineCall}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-200 hover:scale-90 hover:active:scale-80 transform cursor-pointer"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleIncommingCall = useCallback(({ from, offer }) => {
    toast.success("📲 Incoming Call...");
    setIncomingCall({ from, offer });
    setShowPrompt(true);
  }, []);

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      // console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      // console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("call:ended", () => {
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
      setMyStream(null);
      setRemoteStream(null);
      toast("📴 Call Ended");
      Navigate("/");
    });

    return () => {
      socket.off("call:ended");
    };
  }, [socket, myStream]);

  const giveMutedMessage = ({ from, email, newCameraState }) => {
    // console.log(email);
    if (newCameraState) {
      const msg = email + "turned On the Camera";
      toast.success(msg);
    } else {
      const msg = email + "turned Off the Camera";
      toast.success(msg);
    }
  };

  const changeMessages = ({ from, currMsg }) => {
    // console.log("agya bhai mein idhar");
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        icon: from[0].toUpperCase(),
        SID: from,
        message: currMsg,
      },
    ]);
  };

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("camera:toggle", giveMutedMessage);
    socket.on("messages:sent", changeMessages);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("camera:toggle", giveMutedMessage);
      socket.off("messages:sent", changeMessages);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  const sendMessage = (e) => {
    // console.log("Sending to:", remoteSocketId);
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        icon: email[0].toUpperCase(),
        SID: mySocket,
        message: currMsg,
      },
    ]);

    socket.emit("messages:sent", { to: remoteSocketId, currMsg });
    setcurrMsg("");
  };

  return (
    <>
      <Toaster />
      {renderAcceptDeclinePrompt()}
      <div
        className={`${
          isDark ? "bg-black" : "bg-slate-100"
        } w-full h-screen flex flex-col items-center justify-between py-6 overflow-hidden`}
      >
        <div
          className={` ${
            isDark ? "text-white" : "text-blue-700"
          } text-3xl font-bold text-center mb-4`}
        >
          CodeDoodle One-To-One Interaction
        </div>

        <div className="flex flex-wrap justify-center items-center gap-10">
          <div className="bg-transparent h-80 w-96 rounded-xl overflow-hidden">
            {myStream && (
              <ReactPlayer
                playing
                height="100%"
                width="100%"
                url={myStream}
                className="rounded-xl object-cover"
              />
            )}
          </div>

          <div className="bg-transparent h-80 w-96 rounded-xl overflow-hidden">
            {remoteStream && (
              <>
                {/* <h2 className="text-xl font-semibold text-center p-2 text-gray-300">
                  Remote Stream
                </h2> */}
                <ReactPlayer
                  playing
                  height="100%"
                  width="100%"
                  url={remoteStream}
                  className="rounded-xl object-cover"
                />
              </>
            )}
          </div>
        </div>

        <div className="flex justify-center my-3 w-full">
          <div className="bg-white/20 backdrop-blur-md border border-white/30 shadow-lg rounded-full px-6 py-3 flex gap-6">
            <div className="bg-white rounded-full p-3 hover:scale-105 transition">
              {micOn ? (
                <CiMicrophoneOn
                  className="text-red-500 text-2xl cursor-pointer hover:text-blue-400"
                  onClick={toggleMic}
                />
              ) : (
                <CiMicrophoneOff
                  className="text-red-500 text-2xl cursor-pointer hover:text-blue-400"
                  onClick={toggleMic}
                />
              )}
            </div>
            <div className="bg-white rounded-full p-3 hover:scale-105 transition">
              {cameraOn ? (
                <FaCamera
                  className="text-red-500 text-2xl cursor-pointer hover:text-blue-400"
                  onClick={toggleCamera}
                />
              ) : (
                <BiSolidCameraOff
                  className="text-red-500 text-2xl cursor-pointer hover:text-blue-400"
                  onClick={toggleCamera}
                />
              )}
            </div>
            <div className="bg-white rounded-full p-3 hover:scale-105 transition">
              <MdOutlineCallEnd
                className="text-red-500 text-2xl cursor-pointer hover:text-blue-400"
                onClick={cutCall}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mb-6 text-center">
          <h4 className="text-lg mb-2">
            {remoteSocketId ? (
              <span className="text-green-600 font-semibold">Connected</span>
            ) : (
              <span className="text-red-600 font-semibold">
                No one in the Meeting
              </span>
            )}
          </h4>

          <div className="flex gap-4">
            {myStream && (
              <button
                onClick={sendStreams}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-200 hover:scale-90 hover:active:scale-80 transform cursor-pointer"
              >
                Send Stream
              </button>
            )}
            {remoteSocketId && (
              <button
                onClick={handleCallUser}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200 hover:scale-90 hover:active:scale-80 transform cursor-pointer"
              >
                Call User
              </button>
            )}
          </div>
        </div>
      </div>
      <div
        className={`w-full md:w-1/3 lg:w-1/4 h-screen backdrop-blur-md border border-white/30 shadow-lg ${
          isDark ? "bg-gray-800" : "bg-white/20"
        } flex flex-col`}
      >
        <div className="h-12 flex items-center justify-center bg-gray-900 text-white text-lg font-semibold rounded-t-md">
          Chat Box
        </div>

        <div
          className={`hide-scrollbar flex-grow ${
            isDark ? "bg-gray-950" : "bg-white/30"
          } p-4 overflow-y-auto text-gray-800 text-sm`}
        >
          {messages.map((item, key) => {
            const isMe = item.SID === mySocket;
            return (
              <div
                key={key}
                className={`mb-3 flex items-start gap-2 max-w-[80%] ${
                  isMe ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex items-center justify-center h-9 w-9 rounded-full font-bold text-white ${
                    isMe ? "bg-blue-600" : "bg-gray-600"
                  }`}
                >
                  <FaUser/>
                </div>

                {/* Message Bubble */}
                <div
                  className={`px-4 py-2 text-sm rounded-2xl shadow ${
                    isMe
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {item.message}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`flex items-center gap-2 p-3 ${
            isDark ? "bg-gray-950" : "bg-gray-100"
          } rounded-b-md`}
        >
          <input
            type="text"
            value={currMsg}
            onChange={(e) => setcurrMsg(e.target.value)}
            className={`flex-grow px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 ${
              isDark
                ? "focus:ring-green-400 text-green-400"
                : "text-blue-400 focus:ring-blue-400"
            } text-sm`}
            placeholder="Start chatting..."
          />
          <button
            className={`p-2  text-white ${
              isDark
                ? "bg-green-400 hover:bg-green-500"
                : "bg-blue-500 hover:bg-blue-600"
            } transition duration-200 hover:scale-90 hover:active:scale-80 transform rounded-md`}
            onClick={sendMessage}
          >
            <IoSend className="text-xl" />
          </button>
        </div>
      </div>
    </>
  );
};
