// src/components/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Header from './Header';

function MainLayout() {
  return (
    // A classe principal do tema será aplicada em cada página individualmente,
    // assim como era no seu projeto original onde cada body tinha a classe.
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default MainLayout;