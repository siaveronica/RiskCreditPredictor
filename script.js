// Declare motion globally within the Babel script scope
let motion;

// Immediately try to assign motion from the global window object
if (window.FramerMotion) {
    motion = window.FramerMotion;
} else if (window.motion) { // Beberapa CDN mungkin mengeksposnya langsung sebagai window.motion
    motion = window.motion;
} else {
    console.error("Framer Motion library not found. Menggunakan elemen fallback. Animasi akan dinonaktifkan.");
    // Fallback ke elemen React biasa untuk mencegah crash
    motion = {
        div: (props) => React.createElement('div', props),
        h1: (props) => React.createElement('h1', props),
        form: (props) => React.createElement('form', props),
        span: (props) => React.createElement('span', props),
        p: (props) => React.createElement('p', props),
        ul: (props) => React.createElement('ul', props),
        li: (props) => React.createElement('li', props),
        button: (props) => React.createElement('button', props),
        // Tambahkan komponen motion lain sesuai kebutuhan jika digunakan di JSX
    };
}

// Tunda ReactDOM.render hingga window sepenuhnya dimuat
window.onload = function() {
    const { useState, useCallback, useMemo, useEffect } = React;
    
    /**
     * Fungsi helper untuk memformat angka dengan pemisah ribuan.
     * @param {number|string} value - Nilai angka yang akan diformat.
     * @returns {string} Nilai yang diformat.
     */
    const formatNumber = (value) => {
        if (value === '' || value === null || isNaN(value)) return '';
        return new Intl.NumberFormat('id-ID').format(value);
    };

    /**
     * Reusable InputField component for consistent styling and reduced redundancy.
     * @param {object} props - Component props.
     * @param {string} props.label - Label for the input field.
     * @param {string} [props.type='text'] - Type of the input field (e.g., 'text', 'number').
     * @param {string} props.name - Name attribute for the input.
     * @param {string|number} props.value - Current value of the input.
     * @param {function} props.onChange - Handler for input change events.
     * @param {boolean} [props.required=false] - Whether the input is required.
     * @param {function} [props.displayFormatter] - Optional function to format the displayed value.
     * @param {object} [props.props] - Additional props to pass to the input element.
     */
    const InputField = ({ label, type = 'text', name, value, onChange, required = false, displayFormatter, ...props }) => (
      <div>
        <label className="block font-semibold mb-1">{label}</label>
        <input
          type={type}
          name={name}
          value={displayFormatter ? displayFormatter(value) : value}
          onChange={onChange}
          className="w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
          required={required}
          {...props}
        />
      </div>
    );

    /**
     * Reusable SelectField component for consistent styling and reduced redundancy.
     * @param {object} props - Component props.
     * @param {string} props.label - Label for the select field.
     * @param {string} props.name - Name attribute for the select.
     * @param {string} props.value - Current value of the select.
     * @param {function} props.onChange - Handler for select change events.
     * @param {Array<{value: string, label: string}>} props.options - Array of options for the select.
     * @param {object} [props.props] - Additional props to pass to the select element.
     */
    const SelectField = ({ label, name, value, onChange, options, ...props }) => (
      <div>
        <label className="block font-semibold mb-1">{label}</label>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    );

    function App() {
      // State for user login information
      // Initialize user state from localStorage if data exists
      const [user, setUser] = useState(() => {
        try {
          const savedUser = localStorage.getItem('creditPredictorUser');
          return savedUser ? JSON.parse(savedUser) : { nama: '', nik: '', ttl: '', domisili: '' };
        } catch (error) {
          console.error("Error parsing user data from localStorage", error);
          return { nama: '', nik: '', ttl: '', domisili: '' };
        }
      });
      // State to track login status
      const [loggedIn, setLoggedIn] = useState(false);
      // State for credit prediction form data
      const [formData, setFormData] = useState({ usia: '', penghasilan: '', jumlahPinjaman: '', riwayatKredit: 'Baik' });
      // State to store the prediction result
      const [hasil, setHasil] = useState(null);
      // State to store the history of predictions
      const [riwayat, setRiwayat] = useState([]);
      // State to store financial advice generated by LLM
      const [financialAdvice, setFinancialAdvice] = useState('');
      // State for loading indicator for LLM advice
      const [loadingAdvice, setLoadingAdvice] = useState(false);
      // State to store credit improvement plan generated by LLM
      const [creditImprovementPlan, setCreditImprovementPlan] = useState('');
      // State for loading indicator for LLM credit plan
      const [loadingCreditPlan, setLoadingCreditPlan] = useState(false);
      // State for NIK input error message
      const [nikError, setNikError] = useState('');
      // State for Domisili input error message
      const [domisiliError, setDomisiliError] = useState('');
      // Removed financialProductSuggestions and loadingProductSuggestions states


      // Memoized configuration for login form inputs
      const loginInputsConfig = useMemo(() => [
        { name: 'nama', placeholder: 'Nama', type: 'text' },
        { name: 'nik', placeholder: 'NIK', type: 'text', maxLength: 16 }, // Added maxLength for NIK
        { name: 'ttl', placeholder: 'Tanggal Lahir', type: 'date' }, // Changed type to 'date' for calendar picker
        { name: 'domisili', placeholder: 'Tempat Tinggal', type: 'text' },
      ], []);

      // Memoized configuration for credit prediction form fields
      const creditFormFieldsConfig = useMemo(() => [
        // Usia is now calculated, so it's not an input field here
        { label: 'Penghasilan (Rp)', name: 'penghasilan', type: 'text', displayFormatter: formatNumber }, // Changed type to text for formatting
        { label: 'Jumlah Pinjaman (Rp)', name: 'jumlahPinjaman', type: 'text', displayFormatter: formatNumber }, // Changed type to text for formatting
      ], []);

      // Memoized options for credit history select field
      const riwayatKreditOptions = useMemo(() => [
        { value: 'Baik', label: 'Baik' },
        { value: 'Buruk', label: 'Buruk' },
        { value: 'Tidak Ada', label: 'Tidak Ada' },
      ], []);

      /**
       * Calculates age from a birth date string (YYYY-MM-DD).
       * @param {string} dobString - Date of birth in YYYY-MM-DD format.
       * @returns {number|null} Calculated age or null if dobString is invalid.
       */
      const calculateAge = useCallback((dobString) => {
        if (!dobString) return null;
        const birthDate = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
      }, []);

      // Effect to update age when date of birth changes
      useEffect(() => {
        if (user.ttl) {
            const calculatedAge = calculateAge(user.ttl);
            setFormData(prevFormData => ({ ...prevFormData, usia: calculatedAge }));
        } else {
            setFormData(prevFormData => ({ ...prevFormData, usia: '' })); // Clear age if DOB is cleared
        }
      }, [user.ttl, calculateAge]);


      /**
       * Handles changes for login form inputs, including NIK and Domisili validation.
       * Uses useCallback to memoize the function, preventing unnecessary re-renders.
       */
      const handleLoginChange = useCallback((e) => {
        const { name, value } = e.target;
        if (name === 'nik') {
          // Only allow numeric input for NIK
          const numericValue = value.replace(/\D/g, ''); // Remove non-digits
          if (numericValue.length <= 16) {
            setUser(prevUser => ({ ...prevUser, [name]: numericValue }));
            // Clear error if input starts becoming valid
            if (numericValue.length === 16) {
                setNikError('');
            } else {
                setNikError('NIK harus 16 digit angka.'); // NIK must be 16 numeric digits.
            }
          }
        } else if (name === 'domisili') {
            // Only allow alphabetic input for Domisili
            const alphabeticValue = value.replace(/[^a-zA-Z\s]/g, ''); // Remove non-alphabetic characters except spaces
            setUser(prevUser => ({ ...prevUser, [name]: alphabeticValue }));
            if (!/^[a-zA-Z\s]*$/.test(value)) {
                setDomisiliError('Tempat tinggal hanya boleh mengandung huruf.'); // Place of residence can only contain letters.
            } else {
                setDomisiliError('');
            }
        }
        else {
          setUser(prevUser => ({ ...prevUser, [name]: value }));
        }
      }, []);

      /**
       * Handles login form submission.
       * Checks if all user details are filled and NIK/Domisili are valid before setting loggedIn to true.
       * Uses useCallback to memoize the function.
       */
      const handleLoginSubmit = useCallback((e) => {
        e.preventDefault();
        const { nama, nik, ttl, domisili } = user;

        let isValid = true;

        // Validate NIK
        if (!/^\d{16}$/.test(nik)) {
            setNikError('NIK harus 16 digit angka.'); // NIK must be 16 numeric digits.
            isValid = false;
        } else {
            setNikError('');
        }

        // Validate Domisili
        if (!/^[a-zA-Z\s]*$/.test(domisili) || domisili.trim() === '') {
            setDomisiliError('Tempat tinggal hanya boleh mengandung huruf dan tidak boleh kosong.'); // Place of residence can only contain letters and cannot be empty.
            isValid = false;
        } else {
            setDomisiliError('');
        }

        if (isValid && nama && nik && ttl && domisili) {
          setLoggedIn(true);
          // Save user data to localStorage on successful login
          try {
            localStorage.setItem('creditPredictorUser', JSON.stringify(user));
          } catch (error) {
            console.error("Error saving user data to localStorage", error);
          }
        }
      }, [user]); // Dependency on 'user' state

      /**
       * Handles user logout.
       * Resets all relevant states to their initial values.
       * Uses useCallback to memoize the function.
       */
      const handleLogout = useCallback(() => {
        setLoggedIn(false);
        setUser({ nama: '', nik: '', ttl: '', domisili: '' });
        setRiwayat([]);
        setHasil(null);
        setFormData({ usia: '', penghasilan: '', jumlahPinjaman: '', riwayatKredit: 'Baik' }); // Reset form data
        setFinancialAdvice(''); // Clear financial advice on logout
        setCreditImprovementPlan(''); // Clear credit improvement plan on logout
        // Removed setFinancialProductSuggestions(''); // Clear product suggestions on logout
        setNikError(''); // Clear NIK error on logout
        setDomisiliError(''); // Clear Domisili error on logout
        // Clear user data from localStorage on logout
        try {
          localStorage.removeItem('creditPredictorUser');
        } catch (error) {
          console.error("Error removing user data from localStorage", error);
        }
      }, []);

      /**
       * Handles changes for credit prediction form inputs, including number parsing.
       * Uses useCallback to memoize the function.
       */
      const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        if (name === 'penghasilan' || name === 'jumlahPinjaman') {
            // Remove non-numeric characters for internal storage
            const numericValue = value.replace(/\D/g, '');
            setFormData(prevFormData => ({ ...prevFormData, [name]: numericValue }));
        } else {
            setFormData(prevFormData => ({ ...prevFormData, [name]: value }));
        }
      }, []);

      /**
       * Handles credit prediction form submission.
       * Calculates risk score based on form data and updates results and history.
       * Uses useCallback to memoize the function.
       */
      const handleSubmit = useCallback((e) => {
        e.preventDefault();
        let score = 0;
        const { usia, penghasilan, jumlahPinjaman, riwayatKredit } = formData;

        // Parse string values to numbers for calculations (already cleaned in handleChange)
        const numPenghasilan = parseInt(penghasilan);
        const numJumlahPinjaman = parseInt(jumlahPinjaman);
        const numUsia = parseInt(usia); // Usia is now a number from calculateAge

        // Risk scoring logic
        if (numPenghasilan < 3000000) score += 1;
        if (numJumlahPinjaman > numPenghasilan * 2) score += 1;
        if (riwayatKredit === 'Buruk') score += 2;
        if (numUsia < 25) score += 1;

        const hasilPrediksi = score >= 3 ? 'Risiko Tinggi' : 'Risiko Rendah';
        setHasil(hasilPrediksi);

        const waktu = new Date().toLocaleString();
        // Add new prediction to the beginning of the history array
        setRiwayat(prevRiwayat => [{ ...formData, hasil: hasilPrediksi, waktu }, ...prevRiwayat]);
        setFinancialAdvice(''); // Clear previous advice when a new prediction is made
        setCreditImprovementPlan(''); // Clear previous plan when a new prediction is made
        // Removed setFinancialProductSuggestions(''); // Clear product suggestions when a new prediction is made
      }, [formData]); // Dependency on 'formData' state

      /**
       * Fetches financial advice from the Gemini API based on current form data and prediction result.
       * Uses useCallback to memoize the function.
       */
      const getFinancialAdvice = useCallback(async () => {
        setLoadingAdvice(true);
        setFinancialAdvice(''); // Clear previous advice

        const { usia, penghasilan, jumlahPinjaman, riwayatKredit } = formData;
        const currentHasil = hasil || 'Belum Diprediksi'; // Use current prediction result or a default

        // Updated prompt to request financial advice in Indonesian
        const prompt = `Berdasarkan profil kredit berikut:
- Usia: ${usia} tahun
- Penghasilan: Rp${formatNumber(penghasilan)}
- Jumlah Pinjaman: Rp${formatNumber(jumlahPinjaman)}
- Riwayat Kredit: ${riwayatKredit}
- Prediksi Risiko: ${currentHasil}

Mohon berikan saran keuangan yang ringkas untuk mengelola atau meningkatkan risiko kredit dalam Bahasa Indonesia. Jika risikonya tinggi, sarankan tindakan spesifik untuk menurunkannya. Jika risikonya rendah, sarankan cara untuk menjaga kesehatan keuangan yang baik. Fokus pada langkah-langkah praktis dan hindari jargon yang terlalu teknis. Batasi saran menjadi 2-3 paragraf singkat.`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = "AIzaSyAR7s0rKty8rFweCyQASOYZy68j9QMKAWI"; // Ganti dengan kunci API Gemini Anda yang sebenarnya
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const result = await response.json();

          if (result.candidates && result.candidates.length > 0 &&
              result.candidates[0].content && result.candidates[0].content.parts &&
              result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setFinancialAdvice(text);
          } else {
            setFinancialAdvice('Gagal mendapatkan saran. Silakan coba lagi.'); // Failed to get advice. Please try again.
            console.error('Unexpected API response structure:', result);
          }
        } catch (error) {
          setFinancialAdvice('Error mengambil saran. Silakan periksa koneksi jaringan Anda.'); // Error fetching advice. Please check your network connection.
          console.error('Error calling Gemini API:', error);
        } finally {
          setLoadingAdvice(false);
        }
      }, [formData, hasil]); // Dependencies on formData and hasil for the prompt

      /**
       * Fetches a credit improvement plan from the Gemini API.
       * This function is called when the user's predicted risk is 'Risiko Tinggi'.
       * Uses useCallback to memoize the function.
       */
      const generateCreditImprovementPlan = useCallback(async () => {
        setLoadingCreditPlan(true);
        setCreditImprovementPlan(''); // Clear previous plan

        const { usia, penghasilan, jumlahPinjaman, riwayatKredit } = formData;

        const prompt = `Based on the following credit profile which resulted in a 'Risiko Tinggi' (High Risk) prediction:
- Age: ${usia} years
- Income: Rp${formatNumber(penghasilan)}
- Loan Amount: Rp${formatNumber(jumlahPinjaman)}
- Credit History: ${riwayatKredit}

Please provide a step-by-step actionable plan to improve credit risk. Include practical advice on managing debt, improving credit history, and financial planning. Structure it as a numbered list with clear, concise steps. Aim for 5-7 steps.`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = "AIzaSyAR7s0rKty8rFweCyQASOYZy68j9QMKAWI"; // Ganti dengan kunci API Gemini Anda yang sebenarnya
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const result = await response.json();

          if (result.candidates && result.candidates.length > 0 &&
              result.candidates[0].content && result.candidates[0].content.parts &&
              result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setCreditImprovementPlan(text);
          } else {
            setCreditImprovementPlan('Failed to generate a credit improvement plan. Please try again.');
            console.error('Unexpected API response structure for credit plan:', result);
          }
        } catch (error) {
          setCreditImprovementPlan('Error fetching credit improvement plan. Please check your network connection.');
          console.error('Error calling Gemini API:', error);
        } finally {
          setLoadingCreditPlan(false);
        }
      }, [formData]); // Dependency on formData for the prompt

      // Removed getFinancialProductSuggestions function


      /**
       * Exports the prediction history to an Excel file.
       * Uses useCallback to memoize the function.
       * Assumes XLSX is globally available (e.g., loaded via CDN).
       */
      const exportToExcel = useCallback(() => {
        // Check if XLSX is available globally
        if (typeof window.XLSX === 'undefined') {
          console.error('XLSX library not found. Please ensure it is loaded via CDN.');
          return;
        }
        const worksheet = window.XLSX.utils.json_to_sheet(riwayat);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat');
        window.XLSX.writeFile(workbook, 'riwayat_prediksi.xlsx');
      }, [riwayat]); // Dependency on 'riwayat' state

      /**
       * Exports the prediction history to a PDF file.
       * Uses useCallback to memoize the function.
       * Assumes jsPDF and autoTable are globally available (e.g., loaded via CDN).
       */
      const exportToPDF = useCallback(() => {
        // Check if jsPDF is available globally
        // jsPDF is exposed as 'jspdf' in the global scope when loaded via UMD bundle
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
          console.error('jsPDF library not found. Please ensure it is loaded via CDN.');
          return;
        }
        const doc = new window.jspdf.jsPDF();
        const tableColumn = ['Waktu', 'Usia', 'Penghasilan', 'Pinjaman', 'Riwayat Kredit', 'Hasil'];
        const tableRows = riwayat.map((r) => [r.waktu, r.usia, formatNumber(r.penghasilan), formatNumber(r.jumlahPinjaman), r.riwayatKredit, r.hasil]);

        doc.text('Riwayat Prediksi Risiko Kredit', 14, 15);
        // autoTable is typically added as a plugin to jsPDF, so it's called directly on the doc instance
        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20
          });
        } else {
          console.error('jspdf-autotable plugin not found. Please ensure it is loaded via CDN after jsPDF.');
          return;
        }
        doc.save('riwayat_prediksi.pdf');
      }, [riwayat]); // Dependency on 'riwayat' state

      // Render Login Page if not logged in
      if (!loggedIn) {
        return (
          <div className="min-h-screen w-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-700 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background illustration elements - simple circles to mimic abstract shapes */}
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-white opacity-10 rounded-full mix-blend-overlay animate-blob"></div>
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-white opacity-10 rounded-full mix-blend-overlay animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-3/4 w-32 h-32 bg-white opacity-10 rounded-full mix-blend-overlay animate-blob animation-delay-4000"></div>

            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md mt-20 md:mt-0 relative z-10">
              <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-800">Login Pengguna</h2>
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {loginInputsConfig.map((input) => (
                  <div key={input.name}>
                    <InputField
                      name={input.name}
                      placeholder={input.placeholder}
                      value={user[input.name]}
                      onChange={handleLoginChange}
                      required
                      type={input.type} // Use type from config
                      maxLength={input.maxLength} // Use maxLength from config
                    />
                    {input.name === 'nik' && nikError && <p className="text-red-500 text-sm mt-1">{nikError}</p>}
                    {input.name === 'domisili' && domisiliError && <p className="text-red-500 text-sm mt-1">{domisiliError}</p>}
                  </div>
                ))}
                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition duration-300 transform hover:scale-105">Masuk</button>
              </form>
            </motion.div>
          </div>
        );
      }

      // Render Main Application if logged in
      return (
        <div className="min-h-screen w-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-700 flex flex-col items-center p-4 relative overflow-hidden">
          {/* Background illustration elements for main app */}
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-white opacity-10 rounded-full mix-blend-overlay animate-blob"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-white opacity-10 rounded-full mix-blend-overlay animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-3/4 w-32 h-32 bg-white opacity-10 rounded-full mix-blend-overlay animate-blob animation-delay-4000"></div>

          {/* Header */}
          <header className="fixed top-0 left-0 w-full bg-white bg-opacity-90 shadow-md z-10 p-4 flex justify-between items-center rounded-b-xl">
            <motion.h1 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="text-2xl font-bold text-indigo-700">
              Risk Credit Predictor
            </motion.h1>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200 shadow-md">Logout</button>
          </header>

          <div className="flex flex-col items-center justify-center w-full max-w-5xl mt-24 md:mt-0 relative z-10">
            <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-5 mb-8">
              <h2 className="text-3xl font-extrabold mb-4 text-center text-indigo-800">Prediksi Risiko Kredit</h2>
              {/* Display calculated age */}
              <div className="mb-4">
                  <label className="block font-semibold mb-2 text-gray-700">Usia</label>
                  <input
                      type="text"
                      name="usia"
                      value={formData.usia !== null ? `${formData.usia} tahun` : ''}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      readOnly
                  />
              </div>

              {creditFormFieldsConfig.map((field) => (
                <InputField
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  displayFormatter={field.displayFormatter} // Pass the formatter
                />
              ))}
              <SelectField
                label="Riwayat Kredit"
                name="riwayatKredit"
                value={formData.riwayatKredit}
                onChange={handleChange}
                options={riwayatKreditOptions}
              />
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition duration-300 transform hover:scale-105">Prediksi</button>
            </motion.form>

            {hasil && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6 px-6 py-4 bg-white rounded-2xl shadow-xl text-center w-full max-w-md">
                <p className="text-xl font-semibold text-gray-700">Hasil Prediksi:</p>
                <p className={`text-3xl font-bold mt-2 ${hasil === 'Risiko Tinggi' ? 'text-red-600' : 'text-green-600'}`}>{hasil}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-5">
                  <button
                    onClick={getFinancialAdvice}
                    className="bg-purple-600 text-white py-2.5 px-5 rounded-lg hover:bg-purple-700 transition duration-200 shadow-md flex items-center justify-center gap-2"
                    disabled={loadingAdvice}
                  >
                    {loadingAdvice ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-solid rounded-full border-r-transparent"></span>
                    ) : '✨'} Dapatkan Saran Keuangan
                  </button>
                  {hasil === 'Risiko Tinggi' && (
                    <button
                      onClick={generateCreditImprovementPlan}
                      className="bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center gap-2"
                      disabled={loadingCreditPlan}
                    >
                      {loadingCreditPlan ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-solid rounded-full border-r-transparent"></span>
                      ) : '✨'} Dapatkan Rencana Peningkatan Kredit
                    </button>
                  )}
                  {/* Removed Saran Produk Kewangan button */}
                </div>
              </motion.div>
            )}

            {financialAdvice && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-6 px-6 py-4 bg-white rounded-2xl shadow-xl text-left w-full max-w-md">
                <h3 className="text-xl font-semibold mb-3 text-indigo-700">Saran Keuangan:</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{financialAdvice}</p>
              </motion.div>
            )}

            {creditImprovementPlan && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="mt-6 px-6 py-4 bg-white rounded-2xl shadow-xl text-left w-full max-w-md">
                <h3 className="text-xl font-semibold mb-3 text-indigo-700">Rencana Peningkatan Kredit:</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{creditImprovementPlan}</p>
              </motion.div>
            )}

            {/* Removed financialProductSuggestions display section */}

            {riwayat.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0 }} className="mt-10 w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-indigo-700">Riwayat Prediksi</h2>
                  <div className="flex gap-3">
                    <button onClick={exportToExcel} className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-200">Export Excel</button>
                    <button onClick={exportToPDF} className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-200">Export PDF</button>
                  </div>
                </div>
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {riwayat.map((entry, index) => (
                    <li key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <div className="text-sm text-gray-600 font-medium">{entry.waktu}</div>
                      <div className="text-base text-gray-800 mt-1">
                          Usia: <span className="font-semibold">{entry.usia}</span> tahun, 
                          Penghasilan: <span className="font-semibold">Rp{formatNumber(entry.penghasilan)}</span>, 
                          Pinjaman: <span className="font-semibold">Rp{formatNumber(entry.jumlahPinjaman)}</span>
                      </div>
                      <div className="text-base text-gray-800">Riwayat Kredit: <span className="font-semibold">{entry.riwayatKredit}</span></div>
                      <div className={`text-lg font-bold mt-1 ${entry.hasil === 'Risiko Tinggi' ? 'text-red-600' : 'text-green-600'}`}>Hasil: {entry.hasil}</div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      );
    }

    ReactDOM.render(<App />, document.getElementById('root'));
};
