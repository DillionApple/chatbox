import React, { useEffect, useState } from 'react'
import {
    Button,
    Paper,
    Badge,
    Box,
    Divider,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    Stack,
    Grid,
} from '@mui/material'
import iconPNG from '../assets/icon.png'
import { Trans, useTranslation } from 'react-i18next'
import * as runtime from '../packages/runtime'
import * as remote from '../packages/remote'
import { Settings, SponsorAboutBanner, UsageData } from '../stores/types'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface Props {
    open: boolean
    usageData: UsageData
    close(): void
}

export default function UsageDialog(props: Props) {
    const { t } = useTranslation()
    const usageData = props.usageData
    const options = {
        responsive: true,
        plugins: {
          title: {
            display: false,
            text: 'Usage ($)',
          },
          legend: {
            display: false,
          },
        },
    };
    const data = {
        labels: usageData.date_list,
        backgroundColor: 'rgba(53, 162, 235, 1.0)',
        datasets: [
          {
            label: 'Dollars',
            data: usageData.usage_list,
            backgroundColor: '#4caf50',
          },
        ],
    };
    const usagePercent = Math.max(1, usageData.usage / usageData.quota.value * 100)
    return (
        <Dialog open={props.open} onClose={props.close} fullWidth>
            <DialogTitle>{t('Usage')}</DialogTitle>
            <DialogContent>
                <Box sx={{ textAlign: 'center', padding: '0 20px' }}>
                    <h3>Usage($)</h3>
                    <p>{usageData.user_name} {usageData.user_sk.slice(0, 3)}*********{usageData.user_sk.slice(-3)}</p>
                    <p>Quota Type: {usageData.quota.type}</p>
                    <p>Expire Date: {usageData.quota.expire_date}</p>
                    <Bar
                        data={data}
                        options={options}
                    />
                </Box>
                <Box sx={{ textAlign: 'center', padding: '0 0px'}}>
                    <Grid container spacing={0}>
                        <Grid item xs={2}>
                            <div><p><b>Usage($): </b></p></div>
                        </Grid>
                        <Grid item xs={10}>
                            <div style={{width: '100%', backgroundColor: '#bbb', borderRadius: '5px'}}>
                                <div style={{width: `${usagePercent}%`, backgroundColor: '#4caf50', borderRadius: '5px'}}>
                                <p style={{color: '#000'}}>
                                <b>{usageData.usage.toFixed(2)}/{usageData.quota.value}</b>
                                </p>
                                </div>
                            </div>
                        </Grid>
                    </Grid>
                </Box>    
            </DialogContent>
            <DialogActions>
                <Button onClick={props.close}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
