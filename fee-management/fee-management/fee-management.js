"use strict";

const FeeManagement = {

  // ── State ──────────────────────────────────────────────────
  feeHeads: [],
  classes: [],
  routes: [],
  currentTab: "tab-fee-heads",
  editingFeeHeadId: null,
  _feeHeadsLoaded: false,
  _feeSetupInitialized: false,
  _activeFeeHeads: [],
  _feeEntryCounter: 0,
  _transportEntryCounter: 0,
  _modalSaveHandler: null,
  _feeStatusData: [],

  MONTH_NAMES: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  MONTH_FULL: ["January","February","March","April","May","June","July","August","September","October","November","December"],

  // ══════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════

  showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) { alert(message); return; }
    const toast = document.createElement("div");
    toast.className = "fm-toast fm-toast-" + type;
    const icon = type === "success" ? "&#10003;" : type === "error" ? "&#10007;" : "&#9888;";
    toast.innerHTML =
      '<span class="fm-toast-icon">' + icon + "</span>" +
      '<span class="fm-toast-msg">' + this.escapeHtml(message) + "</span>" +
      '<button class="fm-toast-close" onclick="this.parentElement.remove()">&times;</button>';
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.add("show"); });
    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  },

  setLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = show ? "flex" : "none";
  },

  closeModal() {
    const modal = document.getElementById("paymentModal");
    if (modal) modal.style.display = "none";
    this._modalSaveHandler = null;
  },

  openModal(title, bodyHtml, onSave) {
    const modal = document.getElementById("paymentModal");
    if (!modal) return;
    const titleEl = document.getElementById("modalTitle");
    const bodyEl = document.getElementById("modalBody");
    if (titleEl) titleEl.textContent = title || "Record Payment";
    if (bodyEl) bodyEl.innerHTML = bodyHtml || "";
    this._modalSaveHandler = onSave || null;
    modal.style.display = "flex";
  },

  formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return "₹0";
    return "₹" + Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  },

  escapeHtml(str) {
    if (!str) return "";
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(str).replace(/[&<>"']/g, function(c) { return map[c]; });
  },

  debounce(fn, delay) {
    let timer;
    return function() {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, delay || 300);
    };
  },

  clearContainer(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = "";
  },

  getClassDisplay(cls) {
    if (!cls) return "-";
    if (typeof cls === "string") return cls;
    var name = cls.name || "";
    if (cls.nickname) return name + " (" + cls.nickname + ")";
    if (cls.section) return name + " - " + cls.section;
    return name || "-";
  },

  // ══════════════════════════════════════════════════════════
  //  TAB SWITCHING
  // ══════════════════════════════════════════════════════════

  initTabs() {
    var self = this;
    document.querySelectorAll(".fm-tab-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var target = btn.getAttribute("data-tab");
        if (target) self.switchTab(target);
      });
    });
  },

  switchTab(tabId) {
    document.querySelectorAll(".fm-tab-btn").forEach(function(btn) {
      btn.classList.remove("active");
      if (btn.getAttribute("data-tab") === tabId) btn.classList.add("active");
    });
    document.querySelectorAll(".fm-tab-content").forEach(function(panel) {
      panel.classList.remove("tab-active");
    });
    var activePanel = document.getElementById(tabId);
    if (activePanel) activePanel.classList.add("tab-active");
    this.currentTab = tabId;
    // Update URL hash without adding history entries
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#" + tabId);
    }
    this.onTabActivated(tabId);
  },

  async onTabActivated(tabId) {
    try {
      switch (tabId) {
        case "tab-fee-heads":
          if (!this._feeHeadsLoaded) await this.loadFeeHeads();
          break;
        case "tab-transport":
          await this.loadTransportOverview();
          break;
        case "tab-fee-setup":
          if (!this._feeSetupInitialized) await this.initFeeSetup();
          break;
        case "tab-fee-status":
          await this.ensureClasses();
          this.populateClassDropdown("statusClass");
          break;
        case "tab-collection":
          await this.ensureClasses();
          this.populateClassDropdown("collClass");
          this.setDefaultDateRange();
          break;
        case "tab-dues":
          await this.ensureClasses();
          this.populateClassDropdown("duesClass");
          break;
        case "tab-other-dues":
          await this.ensureClasses();
          this.populateClassDropdown("edClass");
          await this.loadExtraDuesHistory();
          break;
      }
    } catch (err) {
      console.error("Tab activation error:", err);
    }
  },

  // ══════════════════════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════════════════════

  async init() {
    this.initTabs();
    this.bindFeeHeadEvents();
    this.bindFeeSetupEvents();
    this.bindFeeStatusEvents();
    this.bindCollectionEvents();
    this.bindDuesEvents();
    this.bindOtherDuesEvents();

    // Modal backdrop click
    var self = this;
    var modal = document.getElementById("paymentModal");
    if (modal) {
      modal.addEventListener("click", function(e) {
        if (e.target === modal) self.closeModal();
      });
    }
    // Modal save button
    var btnSave = document.getElementById("btnModalSave");
    if (btnSave) {
      btnSave.addEventListener("click", function() {
        if (self._modalSaveHandler) self._modalSaveHandler();
      });
    }

    // Remove the initial tab-active from HTML (CSS uses it but we want JS control)
    document.querySelectorAll(".fm-tab-btn").forEach(function(btn) {
      btn.classList.remove("tab-active", "active");
    });
    document.querySelectorAll(".fm-tab-content").forEach(function(panel) {
      panel.classList.remove("tab-active");
    });

    // Activate tab from URL hash if present, else default to fee heads
    var validTabs = ["tab-fee-heads","tab-transport","tab-fee-setup","tab-fee-status","tab-collection","tab-dues","tab-other-dues"];
    var initialTab = "tab-fee-heads";
    if (window.location.hash) {
      var hashTab = window.location.hash.replace("#", "");
      if (validTabs.indexOf(hashTab) !== -1) initialTab = hashTab;
    }
    this.switchTab(initialTab);

    // Listen for hash changes so back/forward works
    var self = this;
    window.addEventListener("hashchange", function() {
      var t = window.location.hash.replace("#", "");
      if (validTabs.indexOf(t) !== -1) self.switchTab(t);
    });
  },

  // ══════════════════════════════════════════════════════════
  //  SHARED: Ensure classes are loaded
  // ══════════════════════════════════════════════════════════

  async ensureClasses() {
    if (this.classes.length > 0) return;
    try {
      var res = await apiFetch("/fee/classes", { auth: true });
      this.classes = res.data || [];
    } catch (err) {
      console.error("ensureClasses:", err);
    }
  },

  populateClassDropdown(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    var current = sel.value;
    var firstOption = sel.querySelector("option:first-child");
    var firstText = firstOption ? firstOption.textContent : "All Classes";
    sel.innerHTML = '<option value="">' + firstText + "</option>";
    this.classes.forEach(function(cls) {
      var opt = document.createElement("option");
      opt.value = cls._id;
      opt.textContent = cls.name + (cls.nickname ? " (" + cls.nickname + ")" : cls.section ? " - " + cls.section : "");
      if (cls._id === current) opt.selected = true;
      sel.appendChild(opt);
    });
  },

  // ══════════════════════════════════════════════════════════
  //  TAB 1 — FEE HEADS (CRUD)
  // ══════════════════════════════════════════════════════════

  bindFeeHeadEvents() {
    var self = this;
    var btnAdd = document.getElementById("btnAddFH");
    if (btnAdd) btnAdd.addEventListener("click", function() { self.saveFeeHead(); });

    var searchInput = document.getElementById("searchFH");
    if (searchInput) {
      searchInput.addEventListener("input", self.debounce(function(e) {
        self.filterFeeHeads(e.target.value);
      }, 250));
    }
  },

  async loadFeeHeads() {
    this.setLoading(true);
    try {
      var res = await apiFetch("/fee-heads", { auth: true });
      this.feeHeads = res.data || [];
      this._feeHeadsLoaded = true;
      this.renderFeeHeads(this.feeHeads);
    } catch (err) {
      console.error("loadFeeHeads:", err);
      this.showToast("Failed to load fee heads", "error");
    } finally {
      this.setLoading(false);
    }
  },

  renderFeeHeads(heads) {
    var container = document.getElementById("fhContainer");
    if (!container) return;
    if (!heads || heads.length === 0) {
      container.innerHTML =
        '<div class="fm-empty"><div class="fm-empty-icon">&#128203;</div>' +
        "<h3>No Fee Heads</h3><p>No fee heads found. Create one using the form.</p></div>";
      return;
    }
    var self = this;
    container.innerHTML = heads.map(function(fh) {
      var isActive = fh.status !== false && fh.status !== "inactive";
      var statusBadge = isActive
        ? '<span class="fm-badge fm-badge-success">Active</span>'
        : '<span class="fm-badge fm-badge-danger">Inactive</span>';
      var colorBar = fh.color ? ' style="--card-color:' + self.escapeHtml(fh.color) + '"' : "";
      return (
        '<div class="fm-fee-head-card"' + colorBar + '>' +
          '<div class="fm-fee-head-top">' +
            '<div>' +
              '<div class="fm-fee-head-title">' + self.escapeHtml(fh.name) + "</div>" +
              '<div class="fm-fee-head-desc">' + self.escapeHtml(fh.description || "No description") + "</div>" +
            "</div>" +
            statusBadge +
          "</div>" +
          '<div class="fm-card-actions">' +
            '<button class="btn-edit" onclick="FeeManagement.editFeeHead(\'' + fh._id + '\')">Edit</button>' +
            '<button class="btn-toggle" onclick="FeeManagement.toggleFeeHeadStatus(\'' + fh._id + '\')">' +
              (isActive ? "Deactivate" : "Activate") +
            "</button>" +
            '<button class="btn-delete" onclick="FeeManagement.deleteFeeHead(\'' + fh._id + '\')">Delete</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");
  },

  filterFeeHeads(query) {
    if (!query || !query.trim()) { this.renderFeeHeads(this.feeHeads); return; }
    var q = query.trim().toLowerCase();
    var filtered = this.feeHeads.filter(function(fh) {
      return (fh.name && fh.name.toLowerCase().indexOf(q) !== -1) ||
             (fh.description && fh.description.toLowerCase().indexOf(q) !== -1);
    });
    this.renderFeeHeads(filtered);
  },

  editFeeHead(id) {
    var fh = this.feeHeads.find(function(h) { return h._id === id; });
    if (!fh) return;
    this.editingFeeHeadId = id;
    var nameInput = document.getElementById("fhName");
    var descInput = document.getElementById("fhDesc");
    var colorInput = document.getElementById("fhColor");
    var btnAdd = document.getElementById("btnAddFH");
    if (nameInput) nameInput.value = fh.name || "";
    if (descInput) descInput.value = fh.description || "";
    if (colorInput) colorInput.value = fh.color || "#ff7a00";
    if (btnAdd) btnAdd.textContent = "Update Fee Head";
    if (nameInput) nameInput.focus();
  },

  resetFeeHeadForm() {
    this.editingFeeHeadId = null;
    var nameInput = document.getElementById("fhName");
    var descInput = document.getElementById("fhDesc");
    var colorInput = document.getElementById("fhColor");
    var btnAdd = document.getElementById("btnAddFH");
    if (nameInput) nameInput.value = "";
    if (descInput) descInput.value = "";
    if (colorInput) colorInput.value = "#ff7a00";
    if (btnAdd) btnAdd.textContent = "+ Add Fee Head";
  },

  async saveFeeHead() {
    var name = (document.getElementById("fhName")?.value || "").trim();
    var description = (document.getElementById("fhDesc")?.value || "").trim();
    var color = document.getElementById("fhColor")?.value || "#ff7a00";
    if (!name) { this.showToast("Fee head name is required", "error"); return; }

    this.setLoading(true);
    try {
      if (this.editingFeeHeadId) {
        await apiFetch("/fee-heads/" + this.editingFeeHeadId, { method: "PUT", auth: true, body: { name: name, description: description, color: color } });
        this.showToast("Fee head updated");
      } else {
        await apiFetch("/fee-heads", { method: "POST", auth: true, body: { name: name, description: description, color: color } });
        this.showToast("Fee head created");
      }
      this.resetFeeHeadForm();
      await this.loadFeeHeads();
    } catch (err) {
      this.showToast(err.message || "Failed to save fee head", "error");
    } finally {
      this.setLoading(false);
    }
  },

  async toggleFeeHeadStatus(id) {
    this.setLoading(true);
    try {
      await apiFetch("/fee-heads/" + id + "/status", { method: "PATCH", auth: true });
      this.showToast("Fee head status updated");
      await this.loadFeeHeads();
    } catch (err) {
      this.showToast("Failed to update status", "error");
    } finally {
      this.setLoading(false);
    }
  },

  async deleteFeeHead(id) {
    var fh = this.feeHeads.find(function(h) { return h._id === id; });
    if (!confirm('Delete "' + (fh ? fh.name : "this fee head") + '"? This cannot be undone.')) return;
    this.setLoading(true);
    try {
      await apiFetch("/fee-heads/" + id, { method: "DELETE", auth: true });
      this.showToast("Fee head deleted");
      if (this.editingFeeHeadId === id) this.resetFeeHeadForm();
      await this.loadFeeHeads();
    } catch (err) {
      this.showToast("Failed to delete fee head", "error");
    } finally {
      this.setLoading(false);
    }
  },

  // ══════════════════════════════════════════════════════════
  //  TAB 2 — TRANSPORT OVERVIEW
  // ══════════════════════════════════════════════════════════

  async loadTransportOverview() {
    this.setLoading(true);
    try {
      var res = await apiFetch("/fee/transport-overview", { auth: true });
      var routeList = res.data || [];
      this.routes = routeList;

      // Compute stats from route array
      var totalStudents = 0, totalCapacity = 0, monthlyRevenue = 0;
      routeList.forEach(function(r) {
        totalStudents += r.totalStudents || 0;
        totalCapacity += r.totalCapacity || 0;
        monthlyRevenue += (r.monthlyFee || 0) * (r.totalStudents || 0);
      });

      this.renderTransportStats({
        totalRoutes: routeList.length,
        totalStudents: totalStudents,
        totalVehicles: totalCapacity,
        monthlyRevenue: monthlyRevenue
      });
      this.renderTransportRoutes(routeList);
    } catch (err) {
      console.error("loadTransportOverview:", err);
      this.showToast("Failed to load transport data", "error");
    } finally {
      this.setLoading(false);
    }
  },

  renderTransportStats(data) {
    var container = document.getElementById("transportStats");
    if (!container) return;
    var self = this;
    var stats = [
      { label: "Total Routes", value: data.totalRoutes || 0, icon: "&#128652;" },
      { label: "Total Students", value: data.totalStudents || 0, icon: "&#128100;" },
      { label: "Vehicle Capacity", value: data.totalVehicles || 0, icon: "&#128663;" },
      { label: "Monthly Revenue", value: self.formatCurrency(data.monthlyRevenue || 0), icon: "&#128176;" }
    ];
    container.className = "fm-transport-stats";
    container.innerHTML = stats.map(function(s) {
      return '<div class="fm-transport-stat">' +
        '<div class="stat-value">' + s.value + "</div>" +
        '<div class="stat-label">' + s.label + "</div>" +
      "</div>";
    }).join("");
  },

  renderTransportRoutes(routeList) {
    var container = document.getElementById("transportContainer");
    if (!container) return;
    if (!routeList || routeList.length === 0) {
      container.innerHTML =
        '<div class="fm-empty"><div class="fm-empty-icon">&#128652;</div>' +
        "<h3>No Routes</h3><p>No transport routes configured.</p></div>";
      return;
    }
    var self = this;
    container.className = "fm-route-cards";
    container.innerHTML = routeList.map(function(route) {
      var stops = route.stops || [];
      var stopText = stops.length > 0
        ? stops.map(function(s) { return self.escapeHtml(s.from || s.name || s); }).join(" → ")
        : "No stops defined";
      var buses = route.buses || [];
      var busInfo = buses.length > 0
        ? buses.map(function(b) { return self.escapeHtml(b.busNumber || "N/A"); }).join(", ")
        : "No vehicles";
      return (
        '<div class="fm-route-card">' +
          "<h3>" + self.escapeHtml(route.routeName || "Unnamed Route") + "</h3>" +
          '<p class="route-desc">' + stopText + "</p>" +
          '<div class="fm-route-meta">' +
            "<span>Fee: " + self.formatCurrency(route.monthlyFee || 0) + "</span>" +
            "<span>Students: " + (route.totalStudents || 0) + "</span>" +
            "<span>Buses: " + busInfo + "</span>" +
            "<span>Capacity: " + (route.totalCapacity || 0) + "</span>" +
          "</div>" +
        "</div>"
      );
    }).join("");
  },

  // ══════════════════════════════════════════════════════════
  //  TAB 3 — FEE SETUP
  // ══════════════════════════════════════════════════════════

  async initFeeSetup() {
    this.setLoading(true);
    try {
      var classRes = await apiFetch("/fee/classes", { auth: true });
      var fhRes = await apiFetch("/fee/fee-heads", { auth: true });
      this.classes = classRes.data || [];
      this._activeFeeHeads = fhRes.data || [];
      // Also load transport routes if not loaded
      if (this.routes.length === 0) {
        try {
          var tRes = await apiFetch("/fee/transport-overview", { auth: true });
          this.routes = tRes.data || [];
        } catch (e) { /* ignore */ }
      }
      this._feeSetupInitialized = true;
    } catch (err) {
      this.showToast("Failed to initialise fee setup", "error");
    } finally {
      this.setLoading(false);
    }
  },

  bindFeeSetupEvents() {
    var self = this;
    var btnLoad = document.getElementById("btnLoadStructure");
    if (btnLoad) btnLoad.addEventListener("click", function() { self.loadFeeStructure(); });
    var btnAddEntry = document.getElementById("btnAddEntry");
    if (btnAddEntry) btnAddEntry.addEventListener("click", function() { self.addFeeEntryRow(); });
    var btnAddTransport = document.getElementById("btnAddTransportEntry");
    if (btnAddTransport) btnAddTransport.addEventListener("click", function() { self.addTransportEntryRow(); });
    var btnSave = document.getElementById("btnSaveStructure");
    if (btnSave) btnSave.addEventListener("click", function() { self.saveFeeStructure(); });
  },

  async loadFeeStructure() {
    var session = document.getElementById("setupSession")?.value;
    if (!session) { this.showToast("Select a session first", "error"); return; }
    this.setLoading(true);
    try {
      var res = await apiFetch("/fee/structure?session=" + encodeURIComponent(session), { auth: true });
      var structure = res.data;
      this.clearContainer("feeEntriesContainer");
      this.clearContainer("transportEntriesContainer");
      this._feeEntryCounter = 0;
      this._transportEntryCounter = 0;

      if (structure) {
        var startMonthSel = document.getElementById("setupStartMonth");
        if (startMonthSel && structure.startMonth != null) startMonthSel.value = String(structure.startMonth);
        var self = this;
        (structure.entries || []).forEach(function(entry) {
          // Handle populated fields
          var feeHeadId = entry.feeHeadId;
          if (feeHeadId && typeof feeHeadId === "object") feeHeadId = feeHeadId._id;
          var classIds = (entry.classIds || []).map(function(c) { return typeof c === "object" ? c._id : c; });
          self.addFeeEntryRow({ feeHeadId: feeHeadId, classIds: classIds, amount: entry.amount, dueMonths: entry.dueMonths });
        });
        (structure.transportEntries || []).forEach(function(entry) {
          var routeId = entry.routeId;
          if (routeId && typeof routeId === "object") routeId = routeId._id;
          self.addTransportEntryRow({ routeId: routeId, amount: entry.amount, dueMonths: entry.dueMonths });
        });
        this.showToast("Fee structure loaded");
      } else {
        this.showToast("No existing structure. Start building one.");
      }
    } catch (err) {
      this.clearContainer("feeEntriesContainer");
      this.clearContainer("transportEntriesContainer");
      this.showToast("No existing structure found", "error");
    } finally {
      this.setLoading(false);
    }
  },

  buildFeeHeadOptions(selectedId) {
    var html = '<option value="">-- Select Fee Head --</option>';
    this._activeFeeHeads.forEach(function(fh) {
      var sel = fh._id === selectedId ? " selected" : "";
      html += '<option value="' + fh._id + '"' + sel + ">" + FeeManagement.escapeHtml(fh.name) + "</option>";
    });
    return html;
  },

  buildRouteOptions(selectedId) {
    var html = '<option value="">-- Select Route --</option>';
    (this.routes || []).forEach(function(r) {
      var sel = r._id === selectedId ? " selected" : "";
      html += '<option value="' + r._id + '"' + sel + ">" + FeeManagement.escapeHtml(r.routeName || r.name || "Route") + " - " + FeeManagement.formatCurrency(r.monthlyFee || 0) + "</option>";
    });
    return html;
  },

  buildMonthCheckboxes(prefix, selectedMonths) {
    var selected = new Set(selectedMonths || []);
    var self = this;
    return '<div class="fm-months-grid">' +
      this.MONTH_NAMES.map(function(name, idx) {
        var checked = selected.has(idx) ? " checked" : "";
        return '<label class="fm-month-check' + (selected.has(idx) ? " checked" : "") + '">' +
          '<input type="checkbox" name="' + prefix + '_month" value="' + idx + '"' + checked + '> ' + name +
        "</label>";
      }).join("") +
    "</div>";
  },

  buildClassCheckboxes(prefix, selectedIds) {
    var selected = new Set((selectedIds || []).map(String));
    if (!this.classes.length) return "<em>No classes available</em>";
    return '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
      this.classes.map(function(cls) {
        var id = cls._id;
        var checked = selected.has(id) ? " checked" : "";
        var label = cls.name + (cls.nickname ? " (" + cls.nickname + ")" : cls.section ? " " + cls.section : "");
        return '<label style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:#f8fafc;border:1px solid #e6ebf2;border-radius:6px;font-size:13px;cursor:pointer;">' +
          '<input type="checkbox" name="' + prefix + '_class" value="' + id + '"' + checked + ' style="accent-color:#ff7a00;"> ' +
          FeeManagement.escapeHtml(label) +
        "</label>";
      }).join("") +
    "</div>";
  },

  addFeeEntryRow(data) {
    var container = document.getElementById("feeEntriesContainer");
    if (!container) return;
    var idx = this._feeEntryCounter++;
    var prefix = "fe_" + idx;
    var row = document.createElement("div");
    row.className = "fm-fee-row fm-card";
    row.innerHTML =
      '<div class="fm-form-group"><label>Fee Head</label>' +
        '<select class="fm-select" name="' + prefix + '_feeHead">' + this.buildFeeHeadOptions(data?.feeHeadId) + "</select></div>" +
      '<div class="fm-form-group"><label>Amount (₹)</label>' +
        '<input type="number" class="fm-input" name="' + prefix + '_amount" placeholder="Amount" min="1" value="' + (data?.amount || "") + '"></div>' +
      '<div class="fm-form-group"><label>Classes</label>' + this.buildClassCheckboxes(prefix, data?.classIds) + "</div>" +
      '<div class="fm-form-group"><label>Due Months</label>' + this.buildMonthCheckboxes(prefix, data?.dueMonths) + "</div>" +
      '<div style="display:flex;justify-content:flex-end;"><button type="button" class="fm-btn fm-btn-sm fm-btn-danger" onclick="FeeManagement.removeFeeEntryRow(this)">Remove</button></div>';
    container.appendChild(row);
  },

  removeFeeEntryRow(btn) {
    var row = btn.closest(".fm-fee-row");
    if (row) row.remove();
  },

  addTransportEntryRow(data) {
    var container = document.getElementById("transportEntriesContainer");
    if (!container) return;
    var idx = this._transportEntryCounter++;
    var prefix = "te_" + idx;
    var row = document.createElement("div");
    row.className = "fm-fee-row fm-card";
    row.innerHTML =
      '<div class="fm-form-group"><label>Route</label>' +
        '<select class="fm-select" name="' + prefix + '_route">' + this.buildRouteOptions(data?.routeId) + "</select></div>" +
      '<div class="fm-form-group"><label>Amount (₹)</label>' +
        '<input type="number" class="fm-input" name="' + prefix + '_amount" placeholder="Amount" min="1" value="' + (data?.amount || "") + '"></div>' +
      '<div class="fm-form-group"><label>Due Months</label>' + this.buildMonthCheckboxes(prefix, data?.dueMonths) + "</div>" +
      '<div style="display:flex;justify-content:flex-end;"><button type="button" class="fm-btn fm-btn-sm fm-btn-danger" onclick="FeeManagement.removeTransportEntryRow(this)">Remove</button></div>';
    container.appendChild(row);
  },

  removeTransportEntryRow(btn) {
    var row = btn.closest(".fm-fee-row");
    if (row) row.remove();
  },

  collectFeeEntries() {
    var container = document.getElementById("feeEntriesContainer");
    if (!container) return [];
    var entries = [];
    container.querySelectorAll(".fm-fee-row").forEach(function(row) {
      var feeHeadId = row.querySelector('select[name$="_feeHead"]')?.value || "";
      var amount = parseFloat(row.querySelector('input[name$="_amount"]')?.value) || 0;
      var classIds = Array.from(row.querySelectorAll('input[name$="_class"]:checked')).map(function(cb) { return cb.value; });
      var dueMonths = Array.from(row.querySelectorAll('input[name$="_month"]:checked')).map(function(cb) { return parseInt(cb.value, 10); });
      if (feeHeadId && amount > 0 && classIds.length > 0 && dueMonths.length > 0) {
        entries.push({ feeHeadId: feeHeadId, classIds: classIds, amount: amount, dueMonths: dueMonths });
      }
    });
    return entries;
  },

  collectTransportEntries() {
    var container = document.getElementById("transportEntriesContainer");
    if (!container) return [];
    var entries = [];
    container.querySelectorAll(".fm-fee-row").forEach(function(row) {
      var routeId = row.querySelector('select[name$="_route"]')?.value || "";
      var amount = parseFloat(row.querySelector('input[name$="_amount"]')?.value) || 0;
      var dueMonths = Array.from(row.querySelectorAll('input[name$="_month"]:checked')).map(function(cb) { return parseInt(cb.value, 10); });
      if (routeId && amount > 0 && dueMonths.length > 0) {
        entries.push({ routeId: routeId, amount: amount, dueMonths: dueMonths });
      }
    });
    return entries;
  },

  async saveFeeStructure() {
    var session = document.getElementById("setupSession")?.value;
    var startMonth = document.getElementById("setupStartMonth")?.value;
    if (!session) { this.showToast("Select a session", "error"); return; }
    var entries = this.collectFeeEntries();
    var transportEntries = this.collectTransportEntries();
    if (entries.length === 0 && transportEntries.length === 0) {
      this.showToast("Add at least one fee entry before saving", "error"); return;
    }
    this.setLoading(true);
    try {
      await apiFetch("/fee/structure", {
        method: "POST", auth: true,
        body: { session: session, startMonth: parseInt(startMonth, 10), entries: entries, transportEntries: transportEntries }
      });
      this.showToast("Fee structure saved successfully");
    } catch (err) {
      this.showToast(err.message || "Failed to save fee structure", "error");
    } finally {
      this.setLoading(false);
    }
  },

  // ══════════════════════════════════════════════════════════
  //  TAB 4 — FEE STATUS
  // ══════════════════════════════════════════════════════════

  bindFeeStatusEvents() {
    var self = this;
    var btnLoad = document.getElementById("btnLoadStatus");
    if (btnLoad) btnLoad.addEventListener("click", function() { self.loadFeeStatus(); });
    var searchInput = document.getElementById("statusSearch");
    if (searchInput) {
      searchInput.addEventListener("input", self.debounce(function(e) {
        self.filterFeeStatus(e.target.value);
      }, 300));
    }
  },

  async loadFeeStatus() {
    var session = document.getElementById("statusSession")?.value;
    var classId = document.getElementById("statusClass")?.value;
    if (!session) { this.showToast("Select a session", "error"); return; }

    var url = "/fee/status?session=" + encodeURIComponent(session);
    if (classId) url += "&classId=" + encodeURIComponent(classId);

    this.setLoading(true);
    try {
      var res = await apiFetch(url, { auth: true });
      this._feeStatusData = res.data || [];
      this.renderFeeStatus(this._feeStatusData);
    } catch (err) {
      this.showToast(err.message || "Failed to load fee status", "error");
    } finally {
      this.setLoading(false);
    }
  },

  filterFeeStatus(query) {
    if (!query || !query.trim()) { this.renderFeeStatus(this._feeStatusData); return; }
    var q = query.trim().toLowerCase();
    var filtered = this._feeStatusData.filter(function(s) {
      return (s.name && s.name.toLowerCase().indexOf(q) !== -1) ||
             (s.fatherName && s.fatherName.toLowerCase().indexOf(q) !== -1) ||
             (s.phone && s.phone.indexOf(q) !== -1);
    });
    this.renderFeeStatus(filtered);
  },

  renderFeeStatus(students) {
    var container = document.getElementById("feeStatusContainer");
    if (!container) return;
    if (!students || students.length === 0) {
      container.innerHTML =
        '<div class="fm-empty"><div class="fm-empty-icon">&#128203;</div>' +
        "<h3>No Students Found</h3><p>Select a session and class, then click Load Status.</p></div>";
      return;
    }
    var self = this;
    container.innerHTML = students.map(function(stu, idx) {
      var className = self.getClassDisplay(stu.class);
      var initials = (stu.name || "?").charAt(0).toUpperCase();
      var paidTag = '<span class="paid-tag">Paid: ' + self.formatCurrency(stu.totalPaid || 0) + "</span>";
      var dueTag = stu.totalDue > 0
        ? '<span class="due-tag">Due: ' + self.formatCurrency(stu.totalDue) + "</span>"
        : '<span class="paid-tag">All Clear</span>';

      // Build monthly tiles for each fee head
      var entriesHtml = (stu.entries || []).map(function(entry) {
        var tilesHtml = (entry.months || []).map(function(m) {
          var tileClass = "fm-payment-tile ";
          if (m.displayStatus === "paid" || m.isPaid) tileClass += "fm-tile-paid";
          else if (m.displayStatus === "partial" || m.isPartial) tileClass += "fm-tile-partial";
          else if (m.baseAmount === 0 && m.effectiveDue === 0) tileClass += "fm-tile-na";
          else tileClass += "fm-tile-unpaid";

          var amount = m.isPaid ? (m.paidAmount || m.amount) : (m.effectiveDue || m.baseAmount || 0);
          return '<div class="' + tileClass + '" onclick="FeeManagement.openPaymentModal(\'' + stu.studentId + "','" + entry.feeHeadId + "'," + m.monthIndex + ",'regular'," + (m.baseAmount || 0) + ",'" + self.escapeHtml(entry.feeHeadName) + "','" + self.escapeHtml(m.monthName || self.MONTH_NAMES[m.monthIndex] || "") + "')\">" +
            '<span class="tile-month">' + (m.monthName || self.MONTH_NAMES[m.monthIndex] || "") + "</span>" +
            '<span class="tile-amount">' + self.formatCurrency(amount) + "</span>" +
          "</div>";
        }).join("");

        return '<div style="margin-top:12px;">' +
          '<h4 style="font-size:14px;font-weight:600;margin-bottom:8px;color:' + (entry.color || '#ff7a00') + ';">' +
            self.escapeHtml(entry.feeHeadName) +
          "</h4>" +
          '<div class="fm-payment-tiles">' + tilesHtml + "</div>" +
        "</div>";
      }).join("");

      // Transport tiles
      var transportHtml = "";
      if (stu.transport && stu.transport.months && stu.transport.months.length > 0) {
        var tTilesHtml = stu.transport.months.map(function(m) {
          var tileClass = "fm-payment-tile ";
          if (m.displayStatus === "paid" || m.isPaid) tileClass += "fm-tile-paid";
          else if (m.displayStatus === "partial" || m.isPartial) tileClass += "fm-tile-partial";
          else tileClass += "fm-tile-unpaid";
          var amount = m.isPaid ? (m.paidAmount || m.amount) : (m.effectiveDue || m.baseAmount || 0);
          return '<div class="' + tileClass + '" onclick="FeeManagement.openPaymentModal(\'' + stu.studentId + "','" + stu.transport.routeId + "'," + m.monthIndex + ",'transport'," + (m.baseAmount || 0) + ",'Transport','" + self.escapeHtml(m.monthName || self.MONTH_NAMES[m.monthIndex] || "") + "')\">" +
            '<span class="tile-month">' + (m.monthName || self.MONTH_NAMES[m.monthIndex] || "") + "</span>" +
            '<span class="tile-amount">' + self.formatCurrency(amount) + "</span>" +
          "</div>";
        }).join("");

        transportHtml = '<div style="margin-top:12px;">' +
          '<h4 style="font-size:14px;font-weight:600;margin-bottom:8px;color:#3b82f6;">&#128652; Transport (' + self.escapeHtml(stu.transport.routeName || "Route") + ")</h4>" +
          '<div class="fm-payment-tiles">' + tTilesHtml + "</div>" +
        "</div>";
      }

      return (
        '<div class="fm-student-row" id="student-' + idx + '">' +
          '<div class="fm-student-header" onclick="FeeManagement.toggleStudentRow(' + idx + ')">' +
            '<div class="fm-student-info">' +
              '<div class="fm-student-avatar">' + initials + "</div>" +
              "<div>" +
                '<div class="fm-student-name">' + self.escapeHtml(stu.name) + "</div>" +
                '<div class="fm-student-class">' + self.escapeHtml(className) +
                  (stu.fatherName ? " | F: " + self.escapeHtml(stu.fatherName) : "") +
                "</div>" +
              "</div>" +
            "</div>" +
            '<div class="fm-student-summary">' + paidTag + dueTag + "</div>" +
            '<div class="fm-expand-icon">&#9660;</div>' +
          "</div>" +
          '<div class="fm-student-body">' +
            entriesHtml + transportHtml +
          "</div>" +
        "</div>"
      );
    }).join("");
  },

  toggleStudentRow(idx) {
    var row = document.getElementById("student-" + idx);
    if (row) row.classList.toggle("expanded");
  },

  // ── Payment Modal ──

  openPaymentModal(studentId, feeHeadOrRouteId, monthIndex, type, baseAmount, headName, monthName) {
    var session = document.getElementById("statusSession")?.value || "2026-27";
    var self = this;

    var bodyHtml =
      '<div class="fm-payment-summary">' +
        '<div class="fm-payment-summary-item"><span class="label">Fee Head</span><span class="value">' + this.escapeHtml(headName) + "</span></div>" +
        '<div class="fm-payment-summary-item"><span class="label">Month</span><span class="value">' + this.escapeHtml(monthName) + "</span></div>" +
        '<div class="fm-payment-summary-item"><span class="label">Base Amount</span><span class="value">' + this.formatCurrency(baseAmount) + "</span></div>" +
        '<div class="fm-payment-summary-item"><span class="label">Type</span><span class="value">' + type + "</span></div>" +
      "</div>" +
      '<div class="fm-form-group"><label>Paid Amount (₹)</label>' +
        '<input type="number" id="modalPaidAmount" class="fm-input" value="' + baseAmount + '" min="1"></div>' +
      '<div class="fm-form-group"><label>Waiver Amount (₹)</label>' +
        '<input type="number" id="modalWaiver" class="fm-input" value="0" min="0"></div>' +
      '<div class="fm-form-group"><label>Late Fee (₹)</label>' +
        '<input type="number" id="modalLateFee" class="fm-input" value="0" min="0"></div>' +
      '<div class="fm-form-group"><label>Payment Mode</label>' +
        '<select id="modalPaymentSource" class="fm-select">' +
          '<option value="cash">Cash</option>' +
          '<option value="online">Online</option>' +
          '<option value="manual_online">Manual Online</option>' +
        "</select></div>" +
      '<div class="fm-form-group"><label>Remark</label>' +
        '<input type="text" id="modalRemark" class="fm-input" placeholder="Optional remark..."></div>';

    this.openModal("Record Payment - " + headName + " (" + monthName + ")", bodyHtml, async function() {
      var paidAmount = parseFloat(document.getElementById("modalPaidAmount")?.value) || 0;
      var waiverAmount = parseFloat(document.getElementById("modalWaiver")?.value) || 0;
      var lateFee = parseFloat(document.getElementById("modalLateFee")?.value) || 0;
      var paymentSource = document.getElementById("modalPaymentSource")?.value || "cash";
      var remark = document.getElementById("modalRemark")?.value || "";

      if (paidAmount < 1) { self.showToast("Paid amount must be at least 1", "error"); return; }

      self.setLoading(true);
      try {
        var body = {
          studentId: studentId,
          session: session,
          monthIndex: parseInt(monthIndex, 10),
          amount: baseAmount,
          paidAmount: paidAmount,
          waiverAmount: waiverAmount,
          lateFee: lateFee,
          type: type,
          paymentSource: paymentSource,
          remark: remark
        };
        if (type === "regular") body.feeHeadId = feeHeadOrRouteId;
        else body.routeId = feeHeadOrRouteId;

        await apiFetch("/fee/payment", { method: "POST", auth: true, body: body });
        self.showToast("Payment recorded successfully");
        self.closeModal();
        await self.loadFeeStatus();
      } catch (err) {
        self.showToast(err.message || "Failed to record payment", "error");
      } finally {
        self.setLoading(false);
      }
    });
  },

  // ══════════════════════════════════════════════════════════
  //  TAB 5 — COLLECTION REPORT
  // ══════════════════════════════════════════════════════════

  bindCollectionEvents() {
    var self = this;
    var btn = document.getElementById("btnLoadCollection");
    if (btn) btn.addEventListener("click", function() { self.loadCollectionReport(); });
  },

  setDefaultDateRange() {
    var fromEl = document.getElementById("collFrom");
    var toEl = document.getElementById("collTo");
    if (fromEl && !fromEl.value) {
      var d = new Date();
      d.setMonth(d.getMonth() - 1);
      fromEl.value = d.toISOString().split("T")[0];
    }
    if (toEl && !toEl.value) {
      toEl.value = new Date().toISOString().split("T")[0];
    }
  },

  async loadCollectionReport() {
    var from = document.getElementById("collFrom")?.value;
    var to = document.getElementById("collTo")?.value;
    var type = document.getElementById("collType")?.value || "all";
    var classId = document.getElementById("collClass")?.value || "";
    var mode = document.getElementById("collMode")?.value || "all";

    if (!from || !to) { this.showToast("Select date range", "error"); return; }

    var url = "/fee/payments/report?from=" + from + "&to=" + to + "&type=" + type + "&mode=" + mode;
    if (classId) url += "&classId=" + classId;

    this.setLoading(true);
    try {
      var res = await apiFetch(url, { auth: true });
      var data = res.data || {};
      this.renderCollectionKPI(data.summary || {});
      this.renderCollectionTable(data.rows || []);
    } catch (err) {
      this.showToast(err.message || "Failed to load collection report", "error");
    } finally {
      this.setLoading(false);
    }
  },

  renderCollectionKPI(summary) {
    var container = document.getElementById("collectionKPI");
    if (!container) return;
    var self = this;
    container.className = "fm-kpi-row";
    var kpis = [
      { label: "Total Collected", value: self.formatCurrency(summary.totalCollected || 0), color: "var(--success)" },
      { label: "Regular Fees", value: self.formatCurrency(summary.totalRegular || 0), color: "var(--primary)" },
      { label: "Transport Fees", value: self.formatCurrency(summary.totalTransport || 0), color: "var(--info)" },
      { label: "Cash", value: self.formatCurrency(summary.totalCash || 0), color: "var(--warning)" },
      { label: "Online", value: self.formatCurrency(summary.totalOnline || 0), color: "#8b5cf6" },
      { label: "Transactions", value: summary.totalTransactions || 0, color: "var(--text)" }
    ];
    container.innerHTML = kpis.map(function(k) {
      return '<div class="fm-kpi-card" style="--kpi-color:' + k.color + '">' +
        '<div class="kpi-label">' + k.label + "</div>" +
        '<div class="kpi-value">' + k.value + "</div>" +
      "</div>";
    }).join("");
  },

  renderCollectionTable(rows) {
    var container = document.getElementById("collectionTableContainer");
    if (!container) return;
    if (!rows || rows.length === 0) {
      container.innerHTML =
        '<div class="fm-empty"><div class="fm-empty-icon">&#128176;</div>' +
        "<h3>No Records</h3><p>No payment records found for the selected filters.</p></div>";
      return;
    }
    var self = this;
    var totalAmount = 0;
    rows.forEach(function(r) { totalAmount += r.paidAmount || 0; });

    container.innerHTML =
      '<div class="fm-table-wrapper"><table class="fm-table">' +
      "<thead><tr>" +
        "<th>#</th><th>Student</th><th>Class</th><th>Type</th><th>Fee Head</th>" +
        "<th>Month</th><th>Amount</th><th>Mode</th><th>Date</th><th>Remark</th>" +
      "</tr></thead><tbody>" +
      rows.map(function(r, i) {
        var modeBadge = r.paymentSource === "cash"
          ? '<span class="fm-badge fm-badge-success">Cash</span>'
          : '<span class="fm-badge fm-badge-info">Online</span>';
        return "<tr>" +
          "<td>" + (i + 1) + "</td>" +
          "<td>" + self.escapeHtml(r.studentName) + "</td>" +
          "<td>" + self.escapeHtml(r.className) + "</td>" +
          "<td>" + self.escapeHtml(r.type) + "</td>" +
          "<td>" + self.escapeHtml(r.feeHeadName || r.routeName || "-") + "</td>" +
          "<td>" + self.escapeHtml(r.monthName || "-") + "</td>" +
          '<td class="text-right">' + self.formatCurrency(r.paidAmount || 0) + "</td>" +
          "<td>" + modeBadge + "</td>" +
          "<td>" + self.escapeHtml(r.paidDate || "-") + "</td>" +
          "<td>" + self.escapeHtml(r.remark || "-") + "</td>" +
        "</tr>";
      }).join("") +
      "</tbody><tfoot><tr>" +
        '<td colspan="6" class="text-right"><strong>Total</strong></td>' +
        '<td class="text-right"><strong>' + self.formatCurrency(totalAmount) + "</strong></td>" +
        "<td colspan=\"3\"></td>" +
      "</tr></tfoot></table></div>";
  },

  // ══════════════════════════════════════════════════════════
  //  TAB 6 — DUES REPORT
  // ══════════════════════════════════════════════════════════

  bindDuesEvents() {
    var self = this;
    var btn = document.getElementById("btnLoadDues");
    if (btn) btn.addEventListener("click", function() { self.loadDuesReport(); });
    var searchInput = document.getElementById("duesSearch");
    if (searchInput) {
      searchInput.addEventListener("input", self.debounce(function(e) {
        self.filterDuesReport(e.target.value);
      }, 300));
    }
    var btnWA = document.getElementById("btnWhatsAppAll");
    if (btnWA) btnWA.addEventListener("click", function() { self.loadWhatsAppReminders(); });
    var btnFlags = document.getElementById("btnAttendanceFlags");
    if (btnFlags) btnFlags.addEventListener("click", function() { self.loadAttendanceFlags(); });
  },

  async loadWhatsAppReminders() {
    var session = document.getElementById("duesSession")?.value;
    if (!session) { this.showToast("Select a session first", "error"); return; }
    var panel = document.getElementById("whatsappPanel");
    var list = document.getElementById("whatsappList");
    if (!panel || !list) return;
    panel.style.display = "block";
    list.innerHTML = "Loading...";
    try {
      var res = await apiFetch("/fee-features/whatsapp-reminders?session=" + encodeURIComponent(session), { auth: true });
      var items = res.data || [];
      if (items.length === 0) { list.innerHTML = "<p style='color:#166534;'>🎉 No defaulters — everyone's paid up!</p>"; return; }
      var self = this;
      list.innerHTML = "<table style='width:100%;border-collapse:collapse;'>" +
        "<thead><tr style='background:#dcfce7;'><th style='text-align:left;padding:8px;'>Student</th><th style='text-align:left;padding:8px;'>Class</th><th style='text-align:left;padding:8px;'>Pending</th><th style='text-align:left;padding:8px;'>Amount</th><th style='padding:8px;'>Action</th></tr></thead>" +
        "<tbody>" + items.map(function(r) {
          return "<tr style='border-bottom:1px solid #d1fae5;'>" +
            "<td style='padding:8px;'>" + self.escapeHtml(r.studentName) + "</td>" +
            "<td style='padding:8px;'>" + self.escapeHtml(r.className) + "</td>" +
            "<td style='padding:8px;'>" + self.escapeHtml(r.pendingMonths) + "</td>" +
            "<td style='padding:8px;'>₹" + r.totalDue + "</td>" +
            "<td style='padding:8px;'>" + (r.whatsappLink ? "<a href='" + r.whatsappLink + "' target='_blank' style='background:#25D366;color:#fff;padding:6px 12px;border-radius:6px;text-decoration:none;'>💬 Send</a>" : "<em>No mobile</em>") + "</td>" +
            "</tr>";
        }).join("") + "</tbody></table>";
    } catch (err) {
      list.innerHTML = "<p style='color:#b91c1c;'>Failed to load reminders: " + err.message + "</p>";
    }
  },

  async loadAttendanceFlags() {
    var panel = document.getElementById("attendanceFlagsPanel");
    var list = document.getElementById("attendanceFlagsList");
    if (!panel || !list) return;
    panel.style.display = "block";
    list.innerHTML = "Loading...";
    try {
      var res = await apiFetch("/fee-features/attendance-flags?threshold=15", { auth: true });
      var items = res.data || [];
      if (items.length === 0) { list.innerHTML = "<p style='color:#166534;'>No students flagged (threshold: 15+ consecutive absences).</p>"; return; }
      var self = this;
      list.innerHTML = "<table style='width:100%;border-collapse:collapse;'>" +
        "<thead><tr style='background:#fed7aa;'><th style='text-align:left;padding:8px;'>Student</th><th style='text-align:left;padding:8px;'>Class</th><th style='text-align:left;padding:8px;'>Absent Days</th><th style='text-align:left;padding:8px;'>Period</th><th style='text-align:left;padding:8px;'>Suggestion</th></tr></thead>" +
        "<tbody>" + items.map(function(r) {
          return "<tr style='border-bottom:1px solid #fed7aa;'>" +
            "<td style='padding:8px;'>" + self.escapeHtml(r.studentName) + "</td>" +
            "<td style='padding:8px;'>" + self.escapeHtml(r.className) + "</td>" +
            "<td style='padding:8px;font-weight:600;color:#b91c1c;'>" + r.consecutiveAbsentDays + " days</td>" +
            "<td style='padding:8px;'>" + r.streakStart + " → " + r.streakEnd + "</td>" +
            "<td style='padding:8px;color:#92400e;'>" + r.suggestion + "</td>" +
            "</tr>";
        }).join("") + "</tbody></table>";
    } catch (err) {
      list.innerHTML = "<p style='color:#b91c1c;'>Failed to load flags: " + err.message + "</p>";
    }
  },

  _duesData: [],

  async loadDuesReport() {
    var session = document.getElementById("duesSession")?.value;
    var classId = document.getElementById("duesClass")?.value || "";
    if (!session) { this.showToast("Select a session", "error"); return; }

    var url = "/fee/dues-report?session=" + encodeURIComponent(session);
    if (classId) url += "&classId=" + encodeURIComponent(classId);

    this.setLoading(true);
    try {
      var res = await apiFetch(url, { auth: true });
      var data = res.data || {};
      this._duesData = data.students || [];
      this.renderDuesSummary(data.summary || {});
      this.renderDuesTable(this._duesData);
    } catch (err) {
      this.showToast(err.message || "Failed to load dues report", "error");
    } finally {
      this.setLoading(false);
    }
  },

  filterDuesReport(query) {
    if (!query || !query.trim()) { this.renderDuesTable(this._duesData); return; }
    var q = query.trim().toLowerCase();
    var filtered = this._duesData.filter(function(s) {
      return (s.studentName && s.studentName.toLowerCase().indexOf(q) !== -1) ||
             (s.fatherName && s.fatherName.toLowerCase().indexOf(q) !== -1) ||
             (s.phone && s.phone.indexOf(q) !== -1);
    });
    this.renderDuesTable(filtered);
  },

  renderDuesSummary(summary) {
    var container = document.getElementById("duesSummary");
    if (!container) return;
    var self = this;
    container.innerHTML =
      '<div class="fm-dues-stat">' +
        '<div class="dues-value text-danger">' + (summary.totalStudentsWithDues || 0) + "</div>" +
        '<div class="dues-label">Students with Dues</div>' +
      "</div>" +
      '<div class="fm-dues-stat">' +
        '<div class="dues-value text-warning">' + self.formatCurrency(summary.totalOutstanding || 0) + "</div>" +
        '<div class="dues-label">Total Outstanding</div>' +
      "</div>";
  },

  renderDuesTable(students) {
    var container = document.getElementById("duesTableContainer");
    if (!container) return;
    if (!students || students.length === 0) {
      container.innerHTML =
        '<div class="fm-empty"><div class="fm-empty-icon">&#10003;</div>' +
        "<h3>No Dues</h3><p>No students with pending dues found.</p></div>";
      return;
    }
    var self = this;
    var grandTotal = 0;
    students.forEach(function(s) { grandTotal += s.totalDue || 0; });

    container.innerHTML =
      '<div class="fm-table-wrapper"><table class="fm-table">' +
      "<thead><tr><th>#</th><th>Student</th><th>Father</th><th>Class</th><th>Phone</th><th>Unpaid Months</th><th>Total Due</th></tr></thead>" +
      "<tbody>" +
      students.map(function(s, i) {
        var unpaidList = (s.unpaidMonths || []).map(function(m) {
          return '<span class="fm-badge fm-badge-warning" style="margin:2px;">' +
            self.escapeHtml(m.feeHeadName) + " - " + self.escapeHtml(m.monthName) + ": " + self.formatCurrency(m.dueAmount) +
          "</span>";
        }).join(" ");
        return "<tr>" +
          "<td>" + (i + 1) + "</td>" +
          "<td><strong>" + self.escapeHtml(s.studentName) + "</strong></td>" +
          "<td>" + self.escapeHtml(s.fatherName || "-") + "</td>" +
          "<td>" + self.escapeHtml(s.className || "-") + "</td>" +
          "<td>" + self.escapeHtml(s.phone || "-") + "</td>" +
          "<td>" + unpaidList + "</td>" +
          '<td class="text-right"><strong class="fm-text-danger">' + self.formatCurrency(s.totalDue) + "</strong></td>" +
        "</tr>";
      }).join("") +
      "</tbody><tfoot><tr>" +
        '<td colspan="6" class="text-right"><strong>Grand Total</strong></td>' +
        '<td class="text-right"><strong class="fm-text-danger">' + self.formatCurrency(grandTotal) + "</strong></td>" +
      "</tr></tfoot></table></div>";
  },

  // ══════════════════════════════════════════════════════════
  //  TAB 7 — OTHER DUES / EXTRA FEES
  // ══════════════════════════════════════════════════════════

  bindOtherDuesEvents() {
    var self = this;
    var btnAssign = document.getElementById("btnAssignExtra");
    if (btnAssign) btnAssign.addEventListener("click", function() { self.assignExtraDues(); });

    var classSelect = document.getElementById("edClass");
    if (classSelect) {
      classSelect.addEventListener("change", function() {
        var classId = classSelect.value;
        if (classId) self.loadStudentsForExtraDues(classId);
        else {
          document.getElementById("edStudentList").innerHTML = '<p class="fm-hint">Select a class first</p>';
        }
      });
    }

    var selectAll = document.getElementById("edSelectAll");
    if (selectAll) {
      selectAll.addEventListener("change", function() {
        var checks = document.querySelectorAll('#edStudentList input[type="checkbox"]');
        checks.forEach(function(cb) { cb.checked = selectAll.checked; });
      });
    }
  },

  async loadStudentsForExtraDues(classId) {
    var container = document.getElementById("edStudentList");
    if (!container) return;
    container.innerHTML = '<p style="color:#64748b;font-size:13px;">Loading students...</p>';
    try {
      var res = await apiFetch("/fee/students?classId=" + encodeURIComponent(classId), { auth: true });
      var students = res.data || [];
      if (students.length === 0) {
        container.innerHTML = '<p style="color:#64748b;font-size:13px;">No students in this class.</p>';
        return;
      }
      container.innerHTML = students.map(function(s) {
        return '<label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px;cursor:pointer;">' +
          '<input type="checkbox" name="edStudent" value="' + s._id + '" style="accent-color:#ff7a00;"> ' +
          FeeManagement.escapeHtml(s.name) +
          (s.fatherName ? ' <span style="color:#94a3b8;">(' + FeeManagement.escapeHtml(s.fatherName) + ")</span>" : "") +
        "</label>";
      }).join("");
      // Reset select all
      var selectAll = document.getElementById("edSelectAll");
      if (selectAll) selectAll.checked = false;
    } catch (err) {
      container.innerHTML = '<p style="color:#ef4444;font-size:13px;">Failed to load students.</p>';
    }
  },

  async assignExtraDues() {
    var title = (document.getElementById("edTitle")?.value || "").trim();
    var amount = parseFloat(document.getElementById("edAmount")?.value) || 0;
    var dueDate = document.getElementById("edDueDate")?.value;
    var classId = document.getElementById("edClass")?.value;
    var description = (document.getElementById("edDesc")?.value || "").trim();
    var session = document.getElementById("statusSession")?.value || document.getElementById("setupSession")?.value || "2026-27";

    if (!title) { this.showToast("Title is required", "error"); return; }
    if (amount < 1) { this.showToast("Amount must be at least 1", "error"); return; }
    if (!dueDate) { this.showToast("Due date is required", "error"); return; }

    var studentChecks = document.querySelectorAll('#edStudentList input[name="edStudent"]:checked');
    var studentIds = Array.from(studentChecks).map(function(cb) { return cb.value; });

    if (studentIds.length === 0) { this.showToast("Select at least one student", "error"); return; }

    this.setLoading(true);
    try {
      await apiFetch("/fee/extra-dues", {
        method: "POST", auth: true,
        body: {
          title: title, amount: amount, dueDate: dueDate,
          classId: classId || null, studentIds: studentIds,
          description: description, session: session
        }
      });
      this.showToast("Extra fees assigned to " + studentIds.length + " student(s)");
      // Reset form
      document.getElementById("edTitle").value = "";
      document.getElementById("edAmount").value = "";
      document.getElementById("edDueDate").value = "";
      document.getElementById("edDesc").value = "";
      var selectAll = document.getElementById("edSelectAll");
      if (selectAll) selectAll.checked = false;
      var checks = document.querySelectorAll('#edStudentList input[type="checkbox"]');
      checks.forEach(function(cb) { cb.checked = false; });
      await this.loadExtraDuesHistory();
    } catch (err) {
      this.showToast(err.message || "Failed to assign extra fees", "error");
    } finally {
      this.setLoading(false);
    }
  },

  async loadExtraDuesHistory() {
    try {
      var res = await apiFetch("/fee/extra-dues", { auth: true });
      var history = res.data || [];
      this.renderExtraDuesHistory(history);
    } catch (err) {
      console.error("loadExtraDuesHistory:", err);
    }
  },

  renderExtraDuesHistory(history) {
    var container = document.getElementById("extraDuesContainer");
    if (!container) return;
    if (!history || history.length === 0) {
      container.innerHTML =
        '<div class="fm-empty"><div class="fm-empty-icon">&#128204;</div>' +
        "<h3>No Extra Dues</h3><p>No extra fees have been assigned yet.</p></div>";
      return;
    }
    var self = this;
    container.className = "fm-dues-history";
    container.innerHTML = history.map(function(item) {
      var student = item.studentId || {};
      var studentName = typeof student === "object" ? (student.name || "Unknown") : "Student";
      var className = "";
      if (student.classId) className = self.getClassDisplay(student.classId);

      var statusBadge = item.isPaid
        ? '<span class="fm-badge fm-badge-success">Paid</span>'
        : '<span class="fm-badge fm-badge-danger">Unpaid</span>';

      var dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-IN") : "-";

      var actions = "";
      if (!item.isPaid) {
        actions =
          '<button class="fm-btn fm-btn-sm fm-btn-success" onclick="FeeManagement.markExtraDuePaid(\'' + item._id + '\')">Mark Paid</button>' +
          '<button class="fm-btn fm-btn-sm fm-btn-secondary" onclick="FeeManagement.editExtraDue(\'' + item._id + '\')">Edit</button>' +
          '<button class="fm-btn fm-btn-sm fm-btn-danger" onclick="FeeManagement.deleteExtraDue(\'' + item._id + '\')">Delete</button>';
      } else {
        actions = '<button class="fm-btn fm-btn-sm fm-btn-secondary" onclick="FeeManagement.revertExtraDue(\'' + item._id + '\')">Revert Payment</button>';
      }

      return (
        '<div class="fm-dues-card">' +
          '<div class="fm-dues-card-top">' +
            '<div class="fm-dues-card-title">' + self.escapeHtml(item.title) + "</div>" +
            '<div class="fm-dues-card-amount">' + self.formatCurrency(item.amount) + "</div>" +
          "</div>" +
          '<div class="fm-dues-card-meta">' +
            "<span>Student: <strong>" + self.escapeHtml(studentName) + "</strong></span>" +
            (className ? "<span>Class: " + self.escapeHtml(className) + "</span>" : "") +
            "<span>Due: " + dueDate + "</span>" +
            statusBadge +
          "</div>" +
          (item.description ? '<p style="font-size:13px;color:#64748b;margin-top:8px;">' + self.escapeHtml(item.description) + "</p>" : "") +
          (item.paidNote ? '<p style="font-size:12px;color:#10b981;margin-top:4px;">' + self.escapeHtml(item.paidNote) + "</p>" : "") +
          '<div class="fm-dues-card-actions">' + actions + "</div>" +
        "</div>"
      );
    }).join("");
  },

  async markExtraDuePaid(id) {
    var paymentMode = prompt("Payment mode (cash/online):", "cash");
    if (!paymentMode) return;
    var remark = prompt("Remark (optional):", "");

    this.setLoading(true);
    try {
      await apiFetch("/fee/extra-dues/" + id + "/pay", {
        method: "PATCH", auth: true,
        body: { paymentMode: paymentMode, remark: remark || "" }
      });
      this.showToast("Extra due marked as paid");
      await this.loadExtraDuesHistory();
    } catch (err) {
      this.showToast(err.message || "Failed to mark as paid", "error");
    } finally {
      this.setLoading(false);
    }
  },

  async revertExtraDue(id) {
    if (!confirm("Revert this payment? The due will become unpaid again.")) return;
    this.setLoading(true);
    try {
      await apiFetch("/fee/extra-dues/" + id + "/revert", { method: "PATCH", auth: true });
      this.showToast("Payment reverted");
      await this.loadExtraDuesHistory();
    } catch (err) {
      this.showToast(err.message || "Failed to revert", "error");
    } finally {
      this.setLoading(false);
    }
  },

  async editExtraDue(id) {
    var title = prompt("New title:");
    if (!title) return;
    var amount = prompt("New amount:");
    if (!amount || isNaN(amount)) return;
    var dueDate = prompt("New due date (YYYY-MM-DD):");

    this.setLoading(true);
    try {
      var body = { title: title, amount: parseFloat(amount) };
      if (dueDate) body.dueDate = dueDate;
      await apiFetch("/fee/extra-dues/" + id, { method: "PUT", auth: true, body: body });
      this.showToast("Extra due updated");
      await this.loadExtraDuesHistory();
    } catch (err) {
      this.showToast(err.message || "Failed to update", "error");
    } finally {
      this.setLoading(false);
    }
  },

  async deleteExtraDue(id) {
    if (!confirm("Delete this extra due? This cannot be undone.")) return;
    this.setLoading(true);
    try {
      await apiFetch("/fee/extra-dues/" + id, { method: "DELETE", auth: true });
      this.showToast("Extra due deleted");
      await this.loadExtraDuesHistory();
    } catch (err) {
      this.showToast(err.message || "Failed to delete", "error");
    } finally {
      this.setLoading(false);
    }
  }

};

// ══════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", function() {
  FeeManagement.init();
});
