sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"masspo/model/formatter",
	"sap/m/MessageBox"
], function (Controller, formatter, MessageBox) {
	"use strict";

	return Controller.extend("masspo.controller.Detail", {
		formatter: formatter,

		onInit: function () {
			this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this._oRouter.getRoute("Detail").attachPatternMatched(this._onRouteMatched, this);

			var oModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oModel);
		},

		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		onNavBack: function () {
			this.getRouter().navTo("List", {}, true);
		},

		_onRouteMatched: function (oEvent) {
			var oParameters = oEvent.getParameters();
			var lblPONo = this.getView().byId("lblPONUmber");
			if (oParameters.arguments.PONumber !== "" || oParameters.arguments.PONumber !== null && oParameters.arguments.PONumber !== "" ||
				oParameters.arguments.VendorCode !== "" || oParameters.arguments.VendorCode !== null && oParameters.arguments.VendorCode !== "") {
				this.PONumber = oParameters.arguments.PONumber;
				this.VendorCode = oParameters.arguments.VendorCode.trim();
				lblPONo.setText(oParameters.arguments.PONumber);
				this._getPOInfo(this.PONumber, this.VendorCode);
			} else {
				MessageBox.error("Error in data");
			}
		},

		_getPOInfo: function (PONumber, VendorCode) {
			var oModel = this.getView().getModel();
			var oTable = this.getView().byId("tblDetail");
			var lblPONumber = this.getView().byId("objectHeader");
			var lblVendorCode = this.getView().byId("lblVendorCode");
			var lblDocDate = this.getView().byId("docDate");

			var filters = [];
			var POFilter = new sap.ui.model.Filter("PONumber", "EQ", PONumber);
			filters.push(POFilter);
			var VednorFilter = new sap.ui.model.Filter("VendorCode", "EQ", VendorCode);
			filters.push(VednorFilter);

			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPOMASS_APPROVE_SRV/", true);
			oDataModel.read("/POHeaders", {
				urlParameters: {
					$expand: 'POItemSet'
				},
				filters: filters,
				success: function (data) {
					lblPONumber.setTitle("PO Number: " + PONumber);
					lblVendorCode.setText(data.results[0].VendorDesc + "(" + VendorCode + ")");
					//Convert date which is returned by Odata.
					var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: "dd-MMM-yyyy"
					});
					//lblDocDate.setText("Document Date: " + dateFormat.format(new Date(data.results[0].DocDate)));
					oModel.setData(data.results[0].POItemSet);
					oTable.setModel(oModel);

				},
				error: function (oError) {
					MessageBox.error(oError);
				}
			});
		},

		handlePOSearch: function (oEvent) {
			var query = oEvent.getSource().getValue();
			if (query && query.length > 0) {

				var oFilter1 = new sap.ui.model.Filter("MaterialDesc", sap.ui.model.FilterOperator.Contains, query);
				var oFilter2 = new sap.ui.model.Filter("PlantName", sap.ui.model.FilterOperator.Contains, query);
				var oFilter3 = new sap.ui.model.Filter("Item", sap.ui.model.FilterOperator.Contains, query);
				var allFilter = new sap.ui.model.Filter([oFilter1, oFilter2, oFilter3], false);
			}
			var obinding = this.getView().byId("tblDetail").getBinding("items");
			obinding.filter(allFilter);
		},

		onApprove: function (evt) {
			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPOMASS_APPROVE_SRV/", true);

			var itemsArray = [];
			itemsArray.push({
				PONumber: this.PONumber
			});

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

							that.onNavBack();

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
		},

		onReject: function (evt) {
			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZPOMASS_APPROVE_SRV/", true);
			var lblPONo = this.getView().byId("lblPONUmber");
			var that=this;
			MessageBox.warning("Are you sure you want to Reject this Purchase Order?", {
				title: "Confirm",
				icon: sap.m.MessageBox.Icon.QUESTION,
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (sAction) {
					if (sAction === "YES") {
						var itemsArray = [];
						itemsArray.push({
							PONumber: lblPONo.getText()
						});

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
										that.onNavBack();
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

	});

});