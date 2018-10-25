import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/

export default function() {
	log('~~ Run Chippen charts ~~')
	const doc = sketch.getSelectedDocument()
	const selectedLayers = doc.selectedLayers

	var isVertical = isVerticalBarchart(doc.selectedLayers)
	
	var minMax_fromSelection = getMinMax(doc.selectedLayers, isVertical)

	var response = myinput(minMax_fromSelection, doc.selectedLayers.layers.length)
	
	var minMax = [response.min, response.max]

	var myRandomSlots = twoRandomSlots(selectedLayers.layers.length, 'Random')
	
	if (response.code !== 1000) {
		return
	}

		for(var i = 0; i<selectedLayers.layers.length; i++){
			var baseLine = 0;

			if(isVertical){
				baseLine = selectedLayers.layers[0].frame.y + selectedLayers.layers[0].frame.height
			}else{
				// baseline doesn't need correction when changing width in horizontal chart
			}
			
			var newLength = 1

			if(response.trendTypeInput == 3 || response.trendTypeInput == 4){
				// reverse minMax if trend is going down
				// and after that just use same code as for trend going up
				minMax = [minMax[1], minMax[0]]
				response.trendTypeInput = response.trendTypeInput-2
			}

			// Random
			if(response.trendTypeInput == 0){
				// random values between min and max
				newLength = Math.floor(Math.random() * (minMax[1]-minMax[0]) ) + minMax[0]    
				if(i == myRandomSlots[0]){
					// force a random slot to be min
					newLength = minMax[0]
				}
				if(i == myRandomSlots[1]){
					// force a random slot to be max
					newLength = minMax[1]
				}
			}
			// Trend going up
			if(response.trendTypeInput == 1 || response.trendTypeInput == 2){
				var stepIncrease = (minMax[1] - minMax[0]) / selectedLayers.layers.length
				if(response.trendTypeInput == 1){
					newLength = (stepIncrease * i) + minMax[0]
				}else if(response.trendTypeInput == 2){
					var increase_random = stepIncrease * Math.random()
					var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
					newLength = (stepIncrease * i) + minMax[0] + (increase_random * plusOrMinus)    
				}
				// force first and last to be min and max
				if(i == 0){ newLength = minMax[0] }
				else if(i == selectedLayers.layers.length-1){
						newLength = minMax[1]
					}
				newLength = Math.round(newLength * 10) / 10
			}
			// Change Width / Height
			if(isVertical){
				// Change height
				selectedLayers.layers[i].frame.height = newLength	
				// Move to baseline
				selectedLayers.layers[i].frame.y = baseLine - newLength
			}else{
				// Change Width
				selectedLayers.layers[i].frame.width = newLength	
			}			
		}
}

function getMinMax(arr, isVertical){
	// arr needs to be doc.selectedLayers
	var min = 0;
	var max = 0;

	if(isVertical){
		// Vertical bar chart (get minMax height)
		for(var i = 0; i<arr.layers.length; i++){
			var thisHeight = arr.layers[i].frame.height
			// Max
			if(thisHeight >max){
				max = thisHeight
			}
			// Min
			if(min == 0){
				// set min at first runfirst
				min = max   
			}
			if(thisHeight < min){
				min = thisHeight
			}
		}
	}else{
		// Horizontal bar chart (get minMax width)
		for(var i = 0; i<arr.layers.length; i++){
			var thisWidth = arr.layers[i].frame.width
			// Max
			if(thisWidth > max){
				max = thisWidth
			}
			// Min
			if(min == 0){
				// set min at first run
				min = max   
			}
			if(thisWidth < min){
				min = thisWidth
			}
		}
	}

	return [Math.ceil(min), Math.ceil(max)]
}

function twoRandomSlots(length, type){
	var slotOne = 0
	var slotTwo = 0

	if(type=='Random'){
		slotOne = Math.floor( Math.random() * length/2) 
		slotTwo = Math.floor( Math.random() * length/2) + Math.floor(length/2)
	}
	return [slotOne, slotTwo]
}


function myinput(myMinMax=[20,100], numOfBars=""){
	var myresponse = {}

	if(myMinMax.length != 2 || myMinMax[0]==myMinMax[1]){
		if(myMinMax[0] > 100){
			myMinMax = [20,myMinMax[1]]
		}else{
			myMinMax = [myMinMax[0],100]
		}
		
	}

	if(numOfBars==0){
		myresponse.code == 1001
		sketch.UI.alert("Sorry buddy", "You need to select multiple rectangles (bars) for this plugin to work.")
	}
	if(numOfBars!=0){

		if(numOfBars==1){
			sketch.UI.alert("Hey, just letting you know", "Most awesome results come when selecting more than 1 bar.")
		}

		// Create initial view panel
	 	var width = 260
	 	var height = 40
	 	var view = NSView.alloc().initWithFrame(NSMakeRect(0, 0, width, height))

	 	// Min Max input
	 	var minInput = NSTextField.alloc().initWithFrame(NSMakeRect(0.0, 15.0, 120.0, 25.0));
	        minInput.cell().setPlaceholderString(myMinMax[0] + " (min)");
	    view.addSubview(minInput);

	    var maxInput = NSTextField.alloc().initWithFrame(NSMakeRect(140, 15.0, 120.0, 25.0));
	        maxInput.cell().setPlaceholderString(myMinMax[1] + " (max)");
	    view.addSubview(maxInput);

		// Nature of data
		var trendTypeInput =  NSView.alloc().initWithFrame(NSMakeRect(0, 0, width, 125))
		// Acts like a template (prototype) for our radio buttons
		var buttonFormat;
		  buttonFormat = NSButtonCell.alloc().init();
		  buttonFormat.setButtonType(NSRadioButton);

		// The matrix will contain all the cells (radio buttons)
		var matrixFormat = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(
		            NSMakeRect(0, 0, 260, 125), // Horizontal position, vertical position, width, height
		            NSRadioModeMatrix, // This makes the radio buttons work together
		            buttonFormat,
		            5, // 1 row
		            1 // 3 columns (for 3 radio buttons)
		        );

		// Settings the size of the radio buttons
		matrixFormat.setCellSize(CGSizeMake(260, 25));

		// Adding the radio buttons to the form
		var cells = matrixFormat.cells();
		              cells.objectAtIndex(0).setTitle("Random");
		              cells.objectAtIndex(1).setTitle("Trend going up ↑ (linear)");
		              cells.objectAtIndex(2).setTitle("Trend going up ↑ (natural)");
		              cells.objectAtIndex(3).setTitle("Trend going down ↓ (linear)");
		              cells.objectAtIndex(4).setTitle("Trend going down ↓ (natural)");

		// Adding the matrix to the form
		trendTypeInput.addSubview(matrixFormat);

		// Setup the window
		var alert = COSAlertWindow.new()
		if(numOfBars==""){
			alert.setMessageText("Create your bar chart")
		}else{
			alert.setMessageText("Create your bar chart ("+numOfBars+" bars selected)")
		}
		
		alert.addButtonWithTitle("Run")
		alert.addButtonWithTitle("Cancel")
		alert.addTextLabelWithValue("Define extrema of bars ");
		alert.alert().window().setInitialFirstResponder(minInput)
	 	alert.addAccessoryView(view)
	 	alert.addTextLabelWithValue("Specify the desired trend");
	 	alert.addAccessoryView(trendTypeInput)
	 	alert.addTextLabelWithValue("~ ~ ~");
	 	alert.addTextLabelWithValue("Note:");
	 	alert.addTextLabelWithValue("Make sure proportional scaling is disabled!");

	 	var responseCode = alert.runModal();

	 	if(responseCode == 1000){
	 		myresponse.code = 1000
	 		// OK
	 		// pass minmax input
	 		if(minInput.stringValue() == ""){
	 			myresponse.min = myMinMax[0]
	 		}else{
	 			myresponse.min = parseInt(minInput.stringValue())
	 		}
	 		if(maxInput.stringValue() == ""){
	 			myresponse.max = myMinMax[1]
	 		}else{
	 			myresponse.max = parseInt(maxInput.stringValue())
	 		}
	 	}else{
	 		// Cancel
	 		myresponse.code = 1001
	 	}
	 	myresponse.trendTypeInput = matrixFormat.cells().indexOfObject(matrixFormat.selectedCell())
	 }
	 return myresponse
}


function isVerticalBarchart(arr){
	// arr needs to be doc.selectedLayers
	var vertical = true
	if(arr.layers.length >= 2){
		if(arr.layers[0].frame.x == arr.layers[1].frame.x){
			vertical = false
		}
	}
	return vertical
}