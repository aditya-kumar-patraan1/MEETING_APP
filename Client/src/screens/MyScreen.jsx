import React from 'react'
import { LeftSide } from './LeftSide'
import { useLocation, useParams } from 'react-router-dom';

export const MyScreen = ({isDark,setIsDark}) => {
  
  const { room } = useParams();
  const location = useLocation();

  const email = location.state?.email || null;

  // console.log("fededsces",email);

  return (
    <div className='flex flex-row'>
      <LeftSide room={room} email={email} isDark={isDark} setIsDark={setIsDark} />
    </div>
  );
};
