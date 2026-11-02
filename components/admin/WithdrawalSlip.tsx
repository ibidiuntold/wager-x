import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const SITE_NAME = "WagerX";

const styles = StyleSheet.create({
  logo: {
    width: 120,
    marginBottom: 10,
  },
  siteName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  page: {
    padding: 30,
    backgroundColor: 'white',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reference: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontSize: 12,
  },
  value: {
    flex: 1,
    fontSize: 12,
  },
  footer: {
    marginTop: 30,
    borderTop: 1,
    paddingTop: 10,
    fontSize: 10,
    color: '#666',
  },
});

interface WithdrawalSlipProps {
  withdrawalData: {
    id: string;
    userId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    reference: string;
  };
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
}

export function WithdrawalSlip({ withdrawalData, userData }: WithdrawalSlipProps) {
  const currentDate = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image 
            src="https://wagerx.io/images/logo/wager-logo.png"
            style={styles.logo}
          />
          <Text style={styles.siteName}>{SITE_NAME}</Text>
          <Text style={styles.title}>Withdrawal Slip</Text>
          <Text style={styles.reference}>Reference: {withdrawalData.reference}</Text>
          <Text style={styles.reference}>Date: {currentDate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{userData.firstName} {userData.lastName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{userData.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{userData.phoneNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawal Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>₦{withdrawalData.amount.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Bank Name:</Text>
            <Text style={styles.value}>{withdrawalData.bankName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Account Number:</Text>
            <Text style={styles.value}>{withdrawalData.accountNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Account Name:</Text>
            <Text style={styles.value}>{withdrawalData.accountName}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>This is an automatically generated withdrawal slip. Please keep for your records.</Text>
        </View>
      </Page>
    </Document>
  );
}
