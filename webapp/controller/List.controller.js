sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"masspo/model/formatter"
], function (Controller, MessageBox, MessageToast, Filter, FilterOperator, JSONModel, formatter) {
	"use strict";

	return Controller.extend("masspo.controller.List", {
		formatter: formatter,
		
	
		onInit: function () {
			this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this._oRouter.getRoute("List").attachPatternMatched(this._onRouteMatched, this);
		
		},
		
		_onRouteMatched: function () {
			var that = this;
			that.FillDocumentType();
			that.FillPOList();
		},

		FillDocumentType: function () {
			var odropbx = this.getView().byId("doctyp");

			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPOMASS_APPROVE_SRV/", true);
			odropbx.setModel(oDataModel);

		},

		FillPOList: function () {

			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPOMASS_APPROVE_SRV/", true);
			var opoTable = this.getView().byId("table");
			opoTable.setModel(oDataModel);
			oDataModel.refresh(true);
			opoTable.getBinding("items").refresh();
		},

		handleDocTypeSearch: function (oEvent) {
			var filters = [];
			var sDocTypeID = this.getView().byId("doctyp").getSelectedKey();
			if (sDocTypeID && sDocTypeID.length > 0) {
				var filter = new sap.ui.model.Filter("DocTypeId", sap.ui.model.FilterOperator.EQ, sDocTypeID);
				filters.push(filter);
			}
			// update list binding
			var list = this.getView().byId("table");
			var binding = list.getBinding("items");
			binding.filter(filters);
		},
		handlePOSearch: function (oEvent) {

			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var oFilter1 = new sap.ui.model.Filter("PONumber", sap.ui.model.FilterOperator.Contains, sQuery);
				var allFilter = new sap.ui.model.Filter([oFilter1], false);
			}
			var obinding = this.getView().byId("table").getBinding("items");
			obinding.filter(allFilter);
		},

		onApprove: function (evt) {
			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPOMASS_APPROVE_SRV/", true);

			var table = this.getView().byId("table");
			var selectedItems = table.getSelectedItems();

			if (selectedItems.length === 0) {
				MessageBox.warning("Please select at least one item !");
				return false;
			} else {
				var itemsArray = [];
				for (var i = 0; i < selectedItems.length; i++) {
					var cells = selectedItems[i].getCells();
					var po = cells[0].getHeaderText();
					itemsArray.push({
						PONumber: po.slice(0, 10)
					});
				}

				var payload = {
					Approved: true,
					POItemSet: itemsArray
				};

				var that = this;

				oDataModel.create("/POHeaders", payload, {
					success: function (data) {
						MessageBox.success("Purchase Order Approved Successfully", {
							icon: sap.m.MessageBox.Icon.Success,
							title: "Success",
							onClose: function (oAction) {
								that.FillPOList();
								that.FillDocumentType();
							}
						});

					},
					error: function (oErr) {
						MessageBox.error(oErr.message, {
							icon: sap.m.MessageBox.Icon.Error,
							title: "Error",
							onClose: function (oAction) {
								that.onNavBack();
							}
						});

					}
				});
			}

		},

		onReject: function (evt) {
			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPOMASS_APPROVE_SRV/", true);

			var table = this.getView().byId("table");
			var selectedItems = table.getSelectedItems();

			if (selectedItems.length === 0) {
				MessageBox.warning("Please select at least one item !");
				return false;
			} else {
				var that = this;
				//var oTable = this.getView().byId("table");
				MessageBox.success("Are you sure you want to Reject this Purchase Order?", {
					title: "Confirm",
					icon: sap.m.MessageBox.Icon.QUESTION,
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					onClose: function (sAction) {
						if (sAction === "YES") {
							var itemsArray = [];
							for (var i = 0; i < selectedItems.length; i++) {
								var cells = selectedItems[i].getCells();
								var po = cells[0].getHeaderText();
								itemsArray.push({
									PONumber: po.slice(0, 10)
								});
							}

							var payload = {
								Approved: false,
								POItemSet: itemsArray
							};

							oDataModel.create("/POHeaders", payload, {
								success: function (data) {
									MessageBox.success("Purchase Order Rejected Successfully", {
										icon: sap.m.MessageBox.Icon.Success,
										title: "Success",
										onClose: function (oAction) {
											that.FillPOList();
											that.FillDocumentType();
										}
									});
								},
								error: function (oErr) {
									MessageBox.error(oErr.message, {
										icon: sap.m.MessageBox.Icon.Error,
										title: "Error"
									});
								}
							});
						}
					}

				}, this);
			}

		},
		onPress: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var objPO = oEvent.getSource().getBindingContext().getObject();

			oRouter.navTo("Detail", {
				PONumber: objPO.PONumber,
				VendorCode: objPO.VendorCode
			});
		}

	});
});