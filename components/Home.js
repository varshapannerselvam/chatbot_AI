import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Chatbot from '../components/Chatbot';
import { RxDashboard } from "react-icons/rx";
import { FcDocument } from "react-icons/fc";

const Home = () => {
  const [stats, setStats] = useState({
    uploads: 0,
    uploadSize: '0 MB',
    chats: 0,
    users: 0,
    recentChats: [],
  });


  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1><RxDashboard style={{color:"brown"}} /> Chatbot Dashboard</h1>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '30px'
      }}>
        <DashboardCard title=" Documents" value={stats.uploads} />
        <DashboardCard title=" Upload Size" value={stats.uploadSize} />
        <DashboardCard title=" Total Chats" value={stats.chats} />
        <DashboardCard title=" Users" value={stats.users} />
      </div>

      {/* Recent Chats */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '10px',
        backgroundColor: '#f1f1f1'
      }}>
        <h3>🕒 Recent Conversations</h3>
        <ul>
          {stats.recentChats.length === 0 ? (
            <li>No recent chats.</li>
          ) : (
            stats.recentChats.map((chat, index) => (
              <li key={index}>
                <strong>{chat.user}</strong>: {chat.message}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Chatbot */}
      <div style={{ marginTop: '40px' }}>
        <Chatbot />
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value }) => (
  <div style={{
    padding: '20px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  }}>
    <h4>{title}</h4>
    <h2 style={{ marginTop: '10px', color: '#1890ff' }}>{value}</h2>
  </div>
);

export default Home;





// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import Chatbot from '../components/Chatbot'; // Your existing component
// import {
//   Box,
//   Typography,
//   Link,
//   Paper,
//   Divider,
//   Select,
//   MenuItem,
//   Button,
//   Grid,
//   Card,
//   CardContent,
//   List,
//   ListItem,
//   ListItemText,
//   CircularProgress
// } from '@mui/material';
// import DashboardIcon from '@mui/icons-material/Dashboard';

// const Home = () => {
//   const [selectedProduct, setSelectedProduct] = useState('');
//   const [selectedInstance, setSelectedInstance] = useState('');
//   const [showChatbot, setShowChatbot] = useState(false);
//   const [products, setProducts] = useState([]);
//   const [instances, setInstances] = useState([]);
//   const [loading, setLoading] = useState({
//     products: false,
//     instances: false
//   });

//   // Your existing products data
//   const productList = [
//     { id: 8, name: 'Verdora' },
//     { id: 9, name: 'Perigo' },
//     { id: 5, name: 'OmniPlus' },
//     { id: 1, name: 'Compass' },
//     { id: 13, name: 'ParivahanEye School' },
//     { id: 12, name: 'ParivahanEye Corporate' },
//     { id: 14, name: 'Biz2Gain -App' },
//     { id: 15, name: 'ComplyMax - App' },
//     { id: 16, name: 'Verdora - App' },
//     { id: 17, name: 'ParivahanEye School - App' },
//     { id: 18, name: 'ParivahanEye Corporate - App' },
//     { id: 3, name: 'Biz2Gain' },
//     { id: 6, name: 'Invoice' },
//     { id: 7, name: 'ComplyMax' },
//     { id: 2, name: 'PeopleChamp' },
//     { id: 4, name: 'Fabric360' }
//   ];

//   useEffect(() => {
//     // Simulate API call to fetch products
//     setLoading(prev => ({ ...prev, products: true }));
//     setTimeout(() => {
//       setProducts(productList);
//       setLoading(prev => ({ ...prev, products: false }));
//     }, 500);
//   }, []);

//   useEffect(() => {
//     if (selectedProduct) {
//       // Simulate API call to fetch instances for selected product
//       setLoading(prev => ({ ...prev, instances: true }));
//       setTimeout(() => {
//         // Mock instances - replace with your actual data
//         const mockInstances = [
//           { id: 1, product_id: selectedProduct, name: 'Production' },
//           { id: 2, product_id: selectedProduct, name: 'Staging' },
//           { id: 3, product_id: selectedProduct, name: 'Development' }
//         ];
//         setInstances(mockInstances);
//         setLoading(prev => ({ ...prev, instances: false }));
//       }, 500);
//     }
//   }, [selectedProduct]);

//   const handleProductChange = (event) => {
//     setSelectedProduct(event.target.value);
//     setSelectedInstance('');
//     setShowChatbot(false);
//   };

//   const handleInstanceChange = (event) => {
//     setSelectedInstance(event.target.value);
//     setShowChatbot(false);
//   };

//   const getSelectedProductName = () => {
//     return products.find(p => p.id === selectedProduct)?.name || '';
//   };

//   const getSelectedInstanceName = () => {
//     return instances.find(i => i.id === selectedInstance)?.name || '';
//   };

//   return (
//     <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
//         <DashboardIcon sx={{ color: 'blue', fontSize: 32, mr: 1 }} />
//         <Typography variant="h4" component="h1">
//           Support Center
//         </Typography>
//       </Box>

//       <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
//         <Typography variant="h5" gutterBottom>
//           Hi, how can we help you?
//         </Typography>
//         <Typography variant="body1" gutterBottom>
//           Use Knowledge Base search below or find answers in{' '}
//           <Link href="#" color="primary">
//             Tutorials
//           </Link>
//         </Typography>
        
//         <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
//           Q. Describe your issue
//         </Typography>
//       </Paper>

//       <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
//         <Typography variant="h5" gutterBottom>
//           Can't find an answer?
//         </Typography>
//         <Typography variant="h6" color="textSecondary" gutterBottom>
//           Select a product and instance to get assistance
//         </Typography>

//         <Box sx={{ mt: 2 }}>
//           <Typography variant="subtitle1" gutterBottom>
//             1. Select the product
//           </Typography>
//           <Select
//             value={selectedProduct}
//             onChange={handleProductChange}
//             displayEmpty
//             fullWidth
//             sx={{ mb: 2 }}
//             disabled={loading.products}
//           >
//             <MenuItem value="">
//               <em>Select Product</em>
//             </MenuItem>
//             {products.map((product) => (
//               <MenuItem key={product.id} value={product.id}>
//                 {product.name}
//               </MenuItem>
//             ))}
//           </Select>
//           {loading.products && <CircularProgress size={24} />}

//           {selectedProduct && (
//             <>
//               <Typography variant="subtitle1" gutterBottom>
//                 2. Select the instance
//               </Typography>
//               <Select
//                 value={selectedInstance}
//                 onChange={handleInstanceChange}
//                 displayEmpty
//                 fullWidth
//                 sx={{ mb: 2 }}
//                 disabled={loading.instances || !selectedProduct}
//               >
//                 <MenuItem value="">
//                   <em>Select Instance</em>
//                 </MenuItem>
//                 {instances.map((instance) => (
//                   <MenuItem key={instance.id} value={instance.id}>
//                     {instance.name}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {loading.instances && <CircularProgress size={24} />}
//             </>
//           )}

//           {selectedInstance && (
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={() => setShowChatbot(true)}
//               sx={{ 
//                 mt: 2, 
//                 bgcolor: 'gray', 
//                 '&:hover': { bgcolor: '#8d6e63' },
//                 minWidth: 200
//               }}
//             >
//               Start Live Chat
//             </Button>
//           )}
//         </Box>
//       </Paper>

//       {/* Your existing stats dashboard can be added here */}

//       {showChatbot && (
//         <Chatbot 
//           context={{
//             product: getSelectedProductName(),
//             instance: getSelectedInstanceName()
//           }}
//           onClose={() => setShowChatbot(false)}
//         />
//       )}
//     </Box>
//   );
// };

// export default Home;





























