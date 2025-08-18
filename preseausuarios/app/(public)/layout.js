// frontend/app/(public)/layout.js
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../styles/globals.css';

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
