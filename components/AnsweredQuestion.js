import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  TablePagination
} from '@mui/material';
import { 
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const AnsweredQuestion = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [editForm, setEditForm] = useState({
    question: '',
    answer: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/knowledgebase');
      setQuestions(response.data.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      showSnackbar('Failed to fetch questions', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditClick = (question) => {
    setEditingId(question.id);
    setEditForm({
      question: question.question,
      answer: question.answer
    });
  };

  const handleViewClick = (question) => {
    setViewingId(question.id);
    setEditForm({
      question: question.question,
      answer: question.answer
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/knowledgebase/${editingId}`, editForm);
      await fetchQuestions();
      setEditingId(null);
      showSnackbar('Question updated successfully', 'success');
    } catch (error) {
      console.error('Error updating question:', error);
      showSnackbar('Failed to update question', 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleCloseView = () => {
    setViewingId(null);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination slice
  const paginatedQuestions = filteredQuestions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            Knowledge Base
          </Box>
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Browse our collection of answered questions
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredQuestions.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}>
          <Typography variant="h6" color="text.secondary">
            No questions found
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'primary.contrastText' }}>Question</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText' }}>Answer Preview</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText' }}>Created Date</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText' }}>Status</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedQuestions.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography noWrap>{item.question}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography noWrap>
                        {item.answer.substring(0, 50)}{item.answer.length > 50 ? '...' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.timestamp), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="Answered" 
                        color="success" 
                        size="small"
                        sx={{ color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewClick(item)} color="primary">
                        <ViewIcon />
                      </IconButton>
                      <IconButton onClick={() => handleEditClick(item)} color="secondary">
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 30, 50, 100]}
            component="div"
            count={filteredQuestions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ mt: 2 }}
          />
        </>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewingId} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Question Details</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Question:
            </Typography>
            <Typography variant="body1">{editForm.question}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Answer:
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {editForm.answer}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView} startIcon={<CloseIcon />}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onClose={handleCancel} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Edit Question</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
              Question
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              name="question"
              value={editForm.question}
              onChange={handleEditChange}
              sx={{ mb: 3 }}
            />
            
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
              Answer
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              name="answer"
              value={editForm.answer}
              onChange={handleEditChange}
              multiline
              rows={6}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCancel} 
            variant="outlined" 
            sx={{ 
              color: 'text.secondary',
              borderColor: 'text.secondary',
              '&:hover': {
                borderColor: 'text.secondary'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnsweredQuestion;