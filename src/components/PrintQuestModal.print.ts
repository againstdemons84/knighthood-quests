/* Print-specific styles for PrintQuestModal */

export const printStyles = `
    @page { 
        margin: 1in; 
    }
    
    body { 
        font-family: Arial, sans-serif; 
        font-size: 12px; 
        line-height: 1.4; 
        color: #333;
    }
    
    .header { 
        text-align: center; 
        border-bottom: 2px solid #333; 
        padding-bottom: 10px; 
        margin-bottom: 20px; 
    }
    
    .title { 
        font-size: 18px; 
        font-weight: bold; 
        margin: 0 0 5px 0; 
    }
    
    .subtitle { 
        font-size: 14px; 
        color: #666; 
        margin: 0 0 10px 0; 
    }
    
    .summary { 
        background: #f5f5f5; 
        padding: 10px; 
        margin-bottom: 20px; 
        border-radius: 5px; 
    }
    
    .summary-row { 
        display: flex; 
        justify-content: flex-end; 
        margin: 3px 0; 
        gap: 10px;
    }
    
    .summary-label {
        min-width: 160px;
        text-align: right;
    }
    
    .summary-value {
        font-weight: bold;
        min-width: 300px;
        text-align: right;
    }
    
    table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 20px; 
    }
    
    th, td { 
        border: 1px solid #ddd; 
        padding: 8px; 
        text-align: left; 
    }
    
    th { 
        background-color: #f2f2f2; 
        font-weight: bold; 
        font-size: 11px; 
    }
    
    .th-number { width: 8%; }
    .th-start { width: 10%; }
    .th-end { width: 10%; }
    .th-workout { width: 32%; }
    .th-duration { width: 8%; }
    .th-tss { width: 8%; }
    .th-if { width: 8%; }
    .th-np { width: 8%; }
    
    .workout-row { 
        background-color: #fff; 
    }
    
    .break-row { 
        background-color: #f9f9f9; 
        font-style: italic; 
    }
    
    .center { 
        text-align: center; 
    }
    
    .bold { 
        font-weight: bold; 
    }
    
    .notes { 
        margin-top: 20px; 
        font-size: 11px; 
        color: #666; 
    }
`;