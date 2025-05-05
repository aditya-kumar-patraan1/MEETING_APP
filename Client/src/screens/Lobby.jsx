import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import { FaMoon, FaSun } from "react-icons/fa";
import {toast,Toaster} from 'react-hot-toast';

const LobbyScreen = ({isDark, setIsDark}) => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      if(!email || !room){
        toast.error("Please Provide Complete Data");
        return;
      }
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      navigate(`/MyScreen/${room}`,{
        state : {
          email
        }
      });
    },
    [navigate,email]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div>
      <Toaster/>
      <button
        onClick={() => setIsDark(!isDark)}
        className="text-xl cursor-pointer rounded-full absolute right-0 top-0 m-8 "
      >
        {isDark ? (
          <FaSun className="text-yellow-400" />
        ) : (
          <FaMoon className="text-gray-800" />
        )}
      </button>
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-black" : "bg-slate-100"} text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300`}>
        {/* Header */}
        <div className="flex justify-between items-center w-full max-w-md mb-6">
          <h1 className={`text-3xl font-semibold ${isDark?"text-white":"text-gray-900"} dark:text-white`}>
            Join a Meeting
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmitForm}
          className={`w-full max-w-md ${isDark?"bg-gray-900 border border-green-300":"bg-white"} dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-4`}
        >
          <div>
            <label
              htmlFor="email"
              className={`block mb-1 ${isDark?"text-green-400":"text-gray-900"} font-medium`}
            >
              Email ID
            </label>
            <input
              type="text"
              id="email"
              className={`w-full px-4 py-2 rounded border ${isDark?"border-green-400 bg-transparent border-2 text-green-400":"dark:bg-gray-700 dark:border-gray-600 dark:text-white"}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
           
            />
          </div>

          <div>
            <label
              htmlFor="room"
              className={`block mb-1 ${isDark?"text-green-400":"text-gray-900"} font-medium`}
            >
              Room Number
            </label>
            <input
              type="text"
              id="room"
              className={`w-full px-4 py-2 rounded border ${isDark?"border-green-400 bg-transparent border-2 text-green-400":"dark:bg-gray-700 dark:border-gray-600 dark:text-white"}`}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`w-full cursor-pointer ${isDark?"bg-green-500 hover:bg-green-600 text-white":"bg-blue-600 hover:bg-blue-700 text-white"} py-2 px-4 rounded transition`}
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;
