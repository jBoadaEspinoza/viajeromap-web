import React from 'react';

const TestHome: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white', minHeight: '100vh' }}>
      <h1>TEST HOME - ESTO DEBERÍA MOSTRARSE</h1>
      <p>Si ves esto, el routing funciona correctamente.</p>
      <p>El problema está en el componente Home original.</p>
    </div>
  );
};

export default TestHome;
