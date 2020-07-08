import { render } from 'react-dom';
import React from 'react';
import BaseballApp from './components/BaseballApp'

if (typeof window !== 'undefined'){
  render (
    <BaseballApp />,
    document.getElementById('app')
  );
}
