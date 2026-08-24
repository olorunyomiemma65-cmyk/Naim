// ── EMAILJS CONFIG ──
var EMAILJS_PUBLIC_KEY  = "mgXvrQKIT2yNaWdH3";
var EMAILJS_SERVICE_ID  = "service_fpdlbxb";
var EMAILJS_TEMPLATE_ID = "template_to9oaxa";

// ── TOAST ──
function toast(type, title, msg) {
    var icons = { error: '✕', success: '✓', info: '◆' };
    var container = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = '<div class="toast-icon">' + (icons[type]||'◆') + '</div><div class="toast-body"><div class="toast-title">' + title + '</div><div class="toast-msg">' + msg + '</div></div>';
    container.appendChild(el);
    setTimeout(function() { el.classList.add('removing'); setTimeout(function() { el.remove(); }, 300); }, 4000);
}

// ── SERVICE SELECTION ──
var selectedService = '';
var selectedPrice   = '';

document.querySelectorAll('.service-card').forEach(function(card) {
    card.addEventListener('click', function() {
        document.querySelectorAll('.service-card').forEach(function(c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        selectedService = card.dataset.service;
        selectedPrice   = card.dataset.price;
    });
});

// ── MIN DATE ──
document.getElementById('date').setAttribute('min', new Date().toISOString().split('T')[0]);

// ── SHOW CONFIRMATION POPUP ──
function showConfirmation(date, time, address, rooms, freq) {
    document.getElementById('confirm-details').innerHTML =
        '<div class="confirm-row"><span>Service</span><span>'    + selectedService + '</span></div>' +
        '<div class="confirm-row"><span>Date</span><span>'       + date            + '</span></div>' +
        '<div class="confirm-row"><span>Time</span><span>'       + time            + '</span></div>' +
        '<div class="confirm-row"><span>Address</span><span>'    + address         + '</span></div>' +
        '<div class="confirm-row"><span>Rooms</span><span>'      + rooms           + '</span></div>' +
        '<div class="confirm-row"><span>Frequency</span><span>'  + freq            + '</span></div>' +
        '<div class="confirm-row"><span>Est. Price</span><span>' + selectedPrice   + '</span></div>';
    document.getElementById('confirm-overlay').classList.add('open');
}

// ── FORM SUBMIT ──
document.getElementById('booking-form').addEventListener('submit', function(e) {
    e.preventDefault();

    var name    = document.getElementById('full-name').value.trim();
    var phone   = document.getElementById('phone').value.trim();
    var email   = document.getElementById('email').value.trim();
    var address = document.getElementById('address').value.trim();
    var date    = document.getElementById('date').value;
    var time    = document.getElementById('time').value;
    var rooms   = document.getElementById('rooms').value;
    var freq    = document.getElementById('frequency').value;
    var notes   = document.getElementById('notes').value.trim();

    if (!selectedService) { toast('error', 'No service selected',  'Please choose a cleaning service above.'); return; }
    if (!name)            { toast('error', 'Missing name',         'Please enter your full name.'); return; }
    if (!phone)           { toast('error', 'Missing phone',        'Please enter your phone number.'); return; }
    if (!address)         { toast('error', 'Missing address',      'Please enter your property address.'); return; }
    if (!date)            { toast('error', 'No date selected',     'Please pick your preferred date.'); return; }
    if (!time)            { toast('error', 'No time selected',     'Please pick your preferred time.'); return; }

    var btn = document.getElementById('submit-btn');
    btn.disabled    = true;
    btn.textContent = 'Sending confirmation...';

    var formattedDate = new Date(date + 'T00:00').toDateString();

    var bookingData = {
        name: name, phone: phone, email: email,
        address: address, date: formattedDate, time: time,
        rooms: rooms, frequency: freq,
        notes: notes || 'None',
        service: selectedService, price: selectedPrice
    };

    // Step 1 — Save to Firestore
    var savePromise = window.saveBookingToFirestore
        ? window.saveBookingToFirestore(bookingData)
        : Promise.resolve();

    savePromise.then(function() {
        // Step 2 — Send confirmation email via EmailJS
        emailjs.init(EMAILJS_PUBLIC_KEY);

        var messageBody =
            'Your booking has been confirmed.\n\n' +
            'Service:   ' + selectedService + '\n' +
            'Date:      ' + formattedDate + '\n' +
            'Time:      ' + time + '\n' +
            'Address:   ' + address + '\n' +
            'Rooms:     ' + rooms + '\n' +
            'Frequency: ' + freq + '\n' +
            'Price:     ' + selectedPrice + '\n' +
            'Phone:     ' + phone + '\n' +
            'Notes:     ' + (notes || 'None');

        return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email:      email,
            customer_name: name,
            subject_line:  'Purivo Booking Confirmed — ' + selectedService,
            message_body:  messageBody
        });
    }).then(function() {
        btn.disabled    = false;
        btn.textContent = 'Confirm Booking →';
        showConfirmation(formattedDate, time, address, rooms, freq);
    }).catch(function(err) {
        console.error('Error:', err);
        btn.disabled    = false;
        btn.textContent = 'Confirm Booking →';
        toast('info', 'Note', 'Booking saved but confirmation email could not be sent.');
        showConfirmation(formattedDate, time, address, rooms, freq);
    });
});

// ── CLOSE CONFIRMATION ──
document.getElementById('confirm-close').addEventListener('click', function() {
    document.getElementById('confirm-overlay').classList.remove('open');
    document.getElementById('booking-form').reset();
    document.querySelectorAll('.service-card').forEach(function(c) { c.classList.remove('selected'); });
    selectedService = '';
    selectedPrice   = '';
});
